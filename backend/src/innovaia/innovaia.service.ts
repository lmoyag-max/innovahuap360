import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiError, GoogleGenAI } from '@google/genai';
import type { AppConfig } from '../config/configuration';

/**
 * Capacidades declaradas de InnovaIA en el portal. Se exponen para que la UI
 * muestre los accesos rápidos; la ejecución real depende del proveedor
 * configurado en INNOVAIA_PROVIDER / INNOVAIA_API_KEY.
 */
export const INNOVAIA_CAPABILITIES = [
  'Generar un acta',
  'Crear ficha de proyecto',
  'Sugerir KPIs',
  'Elaborar carta Gantt',
  'Resumir reunión',
  'Generar informe',
];

const SYSTEM_PROMPT = [
  'Eres InnovaIA, asistente del Comité de Innovación del Hospital de Urgencia Asistencia Pública HUAP.',
  'Tu función es apoyar ideas, proyectos, factibilidades, actas, comunicaciones, indicadores y gestión de innovación.',
  'No inventes datos institucionales.',
  'No entregues diagnósticos clínicos.',
  'No proceses información sensible de pacientes.',
  'Responde de forma clara, profesional y útil.',
].join('\n');

@Injectable()
export class InnovaIaService {
  private readonly logger = new Logger(InnovaIaService.name);

  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  getCapabilities() {
    const { provider } = this.config.get('innovaIa', { infer: true });
    return { capabilities: INNOVAIA_CAPABILITIES, provider, configured: provider !== 'none' };
  }

  async ask(prompt: string): Promise<{ answer: string; provider: string }> {
    const { provider } = this.config.get('innovaIa', { infer: true });

    if (provider === 'gemini') {
      const { apiKey, model } = this.config.get('gemini', { infer: true });
      if (!apiKey) {
        throw new ServiceUnavailableException(
          'InnovaIA no está configurado en este entorno. Defina GEMINI_API_KEY.',
        );
      }
      return { answer: await this.askGemini(prompt, apiKey, model), provider };
    }

    const { apiKey } = this.config.get('innovaIa', { infer: true });
    if (provider === 'none' || !apiKey) {
      throw new ServiceUnavailableException(
        'InnovaIA no está configurado en este entorno. Defina INNOVAIA_PROVIDER e INNOVAIA_API_KEY.',
      );
    }

    if (provider === 'anthropic') {
      return { answer: await this.askAnthropic(prompt, apiKey), provider };
    }

    throw new ServiceUnavailableException(`Proveedor de InnovaIA no soportado: ${provider}`);
  }

  private async askAnthropic(prompt: string, apiKey: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      this.logger.error(`Anthropic API respondió ${response.status}`);
      throw new ServiceUnavailableException('InnovaIA no pudo procesar la solicitud en este momento');
    }

    const data = (await response.json()) as { content?: { type: string; text?: string }[] };
    return data.content?.find((c) => c.type === 'text')?.text ?? '';
  }

  private async askGemini(prompt: string, apiKey: string, model: string): Promise<string> {
    const client = new GoogleGenAI({ apiKey });
    try {
      const response = await client.models.generateContent({
        model,
        contents: prompt,
        config: { systemInstruction: SYSTEM_PROMPT },
      });
      return response.text ?? '';
    } catch (error) {
      if (error instanceof ApiError) {
        this.logger.error(`Gemini API respondió ${error.status}: ${error.message}`);
        if (error.status === 429) {
          throw new ServiceUnavailableException(
            'Se alcanzó el límite de uso del proveedor de IA por ahora. Intenta nuevamente en unos minutos.',
          );
        }
        // La API de Gemini responde 400 INVALID_ARGUMENT (no 401/403) cuando
        // la API Key no es válida, además de los códigos 401/403 estándar.
        const isAuthError =
          error.status === 401 ||
          error.status === 403 ||
          (error.status === 400 && /api key/i.test(error.message));
        if (isAuthError) {
          throw new ServiceUnavailableException(
            'InnovaIA no pudo autenticarse con el proveedor de IA. Verifica la API Key configurada.',
          );
        }
        throw new ServiceUnavailableException('InnovaIA no pudo procesar la solicitud en este momento');
      }

      this.logger.error(`Gemini: error de conexión — ${(error as Error)?.message}`);
      throw new ServiceUnavailableException('No se pudo conectar con el proveedor de IA. Intenta nuevamente.');
    }
  }
}
