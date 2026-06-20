import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

const SYSTEM_PROMPT =
  'Eres InnovaIA, asistente del Comité de Innovación del Hospital de Urgencia Asistencia ' +
  'Pública (HUAP). Ayudas a redactar actas, fichas de proyecto, KPIs y resúmenes ejecutivos ' +
  'en español, con un tono institucional y clínico-sanitario.';

@Injectable()
export class InnovaIaService {
  private readonly logger = new Logger(InnovaIaService.name);

  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  getCapabilities() {
    const { provider } = this.config.get('innovaIa', { infer: true });
    return { capabilities: INNOVAIA_CAPABILITIES, provider, configured: provider !== 'none' };
  }

  async ask(prompt: string): Promise<{ answer: string; provider: string }> {
    const { provider, apiKey } = this.config.get('innovaIa', { infer: true });

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
}
