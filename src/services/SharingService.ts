import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { CodeSnippet, InteractiveSessionState } from './InteractiveStudioService';
import LocalStorageService from './LocalStorageService';

interface SharingOptions {
  title?: string; // Dialog-Titel (nur auf einigen Plattformen)
  mimeType?: string; // MIME-Typ der Datei
  dialogTitle?: string; // Titel des Teilen-Dialogs (Android)
  UTI?: string; // Uniform Type Identifier (iOS)
  format?: 'text' | 'markdown' | 'json' | 'html';
  includeSystemMessages?: boolean;
  includeTimestamps?: boolean;
  includeMetadata?: boolean;
}

class SharingService {
  async isAvailable(): Promise<boolean> {
    return await Sharing.isAvailableAsync();
  }

  async shareFile(fileUri: string, options: SharingOptions = {}): Promise<void> {
    try {
      if (!(await this.isAvailable())) {
        throw new Error('Teilen ist auf diesem Gerät nicht verfügbar');
      }

      // Überprüfen, ob die Datei existiert
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error(`Datei existiert nicht: ${fileUri}`);
      }

      await Sharing.shareAsync(fileUri, {
        dialogTitle: options.dialogTitle || 'Teilen mit',
        mimeType: options.mimeType,
        UTI: options.UTI,
      });
    } catch (error) {
      console.error('Fehler beim Teilen der Datei:', error);
      throw error;
    }
  }

  async shareText(text: string, options: SharingOptions = {}): Promise<void> {
    try {
      if (!(await this.isAvailable())) {
        throw new Error('Teilen ist auf diesem Gerät nicht verfügbar');
      }

      // Text in eine temporäre Datei schreiben, um sie zu teilen
      const tempFile = `${FileSystem.cacheDirectory}temp_share_${Date.now()}.txt`;
      await FileSystem.writeAsStringAsync(tempFile, text);

      await this.shareFile(tempFile, {
        ...options,
        mimeType: 'text/plain',
      });

      // Temporäre Datei nach dem Teilen löschen
      setTimeout(async () => {
        try {
          await FileSystem.deleteAsync(tempFile, { idempotent: true });
        } catch (e) {
          console.warn('Fehler beim Löschen der temporären Datei:', e);
        }
      }, 3000);
    } catch (error) {
      console.error('Fehler beim Teilen des Textes:', error);
      throw error;
    }
  }

  async shareUrl(url: string, title?: string): Promise<void> {
    if (Platform.OS === 'web') {
      // Fallback für Web (kopiert URL in die Zwischenablage)
      try {
        await navigator.clipboard.writeText(url);
        console.log('URL in die Zwischenablage kopiert');
      } catch (e) {
        console.error('Fehler beim Kopieren in die Zwischenablage:', e);
      }
      return;
    }

    try {
      if (!(await this.isAvailable())) {
        throw new Error('Teilen ist auf diesem Gerät nicht verfügbar');
      }

      // Text in eine temporäre Datei schreiben, um sie zu teilen
      const content = title ? `${title}\n${url}` : url;
      await this.shareText(content);
    } catch (error) {
      console.error('Fehler beim Teilen der URL:', error);
      throw error;
    }
  }

  /**
   * Eine vollständige Session teilen
   */
  public async shareSession(sessionId: string, options: SharingOptions = {}): Promise<boolean> {
    try {
      // Session laden
      const session = await LocalStorageService.getInteractiveSessionById(sessionId);
      if (!session) {
        console.error('Session nicht gefunden:', sessionId);
        return false;
      }

      // Inhalt basierend auf Format generieren
      let content = '';
      const format = options.format || 'markdown';

      switch (format) {
        case 'json':
          content = this.formatSessionAsJSON(session, options);
          break;
        case 'html':
          content = this.formatSessionAsHTML(session, options);
          break;
        case 'text':
          content = this.formatSessionAsText(session, options);
          break;
        case 'markdown':
        default:
          content = this.formatSessionAsMarkdown(session, options);
          break;
      }

      // Inhalt teilen (using new shareText method)
      const title = `Gemini Live-Session: ${session.topic}`;
      await this.shareText(content, { title, mimeType: `text/${format}` });

      // Sharing-Aktion zur Offline-Warteschlange hinzufügen
      await LocalStorageService.addToSyncQueue({
        type: 'share_content',
        data: {
          sessionId,
          title,
          content,
          format,
          timestamp: new Date().toISOString()
        },
        timestamp: Date.now()
      });

      return true;
    } catch (error) {
      console.error('Fehler beim Teilen der Session:', error);
      return false;
    }
  }

  /**
   * Einen spezifischen Teil einer Unterhaltung teilen
   */
  public async shareMessage(sessionId: string, messageIndex: number, options: SharingOptions = {}): Promise<boolean> {
    try {
      // Session laden
      const session = await LocalStorageService.getInteractiveSessionById(sessionId);
      if (!session || !session.messages[messageIndex]) {
        console.error('Session oder Nachricht nicht gefunden');
        return false;
      }

      const message = session.messages[messageIndex];

      // Inhalt teilen (using new shareText method)
      const title = `Nachricht aus ${session.topic}`;
      await this.shareText(message.content, { title });

      return true;
    } catch (error) {
      console.error('Fehler beim Teilen der Nachricht:', error);
      return false;
    }
  }

  /**
   * Ein oder mehrere Code-Snippets teilen
   */
  public async shareCodeSnippets(sessionId: string, snippetIndices: number[] = []): Promise<boolean> {
    try {
      // Session laden
      const session = await LocalStorageService.getInteractiveSessionById(sessionId);
      if (!session) {
        console.error('Session nicht gefunden');
        return false;
      }

      // Wenn keine spezifischen Snippets angegeben sind, alle teilen
      const indices = snippetIndices.length > 0 ? snippetIndices : session.codeSnippets.map((_, i) => i);

      // Ausgewählte Snippets extrahieren
      const snippets = indices
        .map(i => session.codeSnippets[i])
        .filter(s => s !== undefined);

      if (snippets.length === 0) {
        console.error('Keine Code-Snippets gefunden');
        return false;
      }

      // Snippets formatieren
      let content = '';

      snippets.forEach((snippet, i) => {
        content += `// ${snippet.purpose}\n`;
        content += `// Sprache: ${snippet.language}\n`;
        content += snippet.code;

        if (i < snippets.length - 1) {
          content += '\n\n';
        }
      });

      // Inhalt teilen (using new shareText method)
      const title = `Code aus ${session.topic}`;
      await this.shareText(content, { title });

      return true;
    } catch (error) {
      console.error('Fehler beim Teilen der Code-Snippets:', error);
      return false;
    }
  }

  /**
   * Session als JSON formatieren
   */
  private formatSessionAsJSON(session: InteractiveSessionState, options: SharingOptions): string {
    const { includeSystemMessages = false, includeMetadata = true } = options;

    // Optional Systemrollen filtern
    const filteredMessages = includeSystemMessages
      ? session.messages
      : session.messages.filter(msg => msg.role !== 'system');

    // Ausgabeformat erstellen
    const output = {
      topic: session.topic,
      messages: filteredMessages,
      code_snippets: session.codeSnippets,
      ...(includeMetadata ? {
        id: session.sessionId,
        created_at: new Date().toISOString(),
        is_active: session.isActive
      } : {})
    };

    return JSON.stringify(output, null, 2);
  }

  /**
   * Session als HTML formatieren
   */
  private formatSessionAsHTML(session: InteractiveSessionState, options: SharingOptions): string {
    const { includeSystemMessages = false } = options;

    // Optional Systemrollen filtern
    const filteredMessages = includeSystemMessages
      ? session.messages
      : session.messages.filter(msg => msg.role !== 'system');

    // HTML generieren
    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${session.topic}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
    .message { margin-bottom: 20px; padding: 10px; border-radius: 5px; }
    .user { background-color: #e1f5fe; border-left: 4px solid #03a9f4; }
    .assistant { background-color: #f1f8e9; border-left: 4px solid #7cb342; }
    .system { background-color: #fafafa; border-left: 4px solid #9e9e9e; font-style: italic; }
    .code-section { margin-top: 30px; }
    pre { background-color: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
    h1 { color: #333; }
    h2 { color: #555; margin-top: 30px; }
  </style>
</head>
<body>
  <h1>${session.topic}</h1>

  <div class="conversation">
    <h2>Unterhaltung</h2>`;

    filteredMessages.forEach(msg => {
      html += `
    <div class="message ${msg.role}">
      <strong>${msg.role === 'user' ? 'Du' : msg.role === 'assistant' ? 'KI-Assistent' : 'System'}:</strong>
      <div>${msg.content.replace(/\n/g, '<br>')}</div>
    </div>`;
    });

    if (session.codeSnippets.length > 0) {
      html += `
  <div class="code-section">
    <h2>Code-Snippets</h2>`;

      session.codeSnippets.forEach(snippet => {
        html += `
    <h3>${snippet.purpose}</h3>
    <p>Sprache: ${snippet.language}</p>
    <pre><code>${snippet.code}</code></pre>`;
      });

      html += `
  </div>`;
    }

    html += `
</body>
</html>`;

    return html;
  }

  /**
   * Session als Markdown formatieren
   */
  private formatSessionAsMarkdown(session: InteractiveSessionState, options: SharingOptions): string {
    const { includeSystemMessages = false } = options;

    // Optional Systemrollen filtern
    const filteredMessages = includeSystemMessages
      ? session.messages
      : session.messages.filter(msg => msg.role !== 'system');

    // Markdown generieren
    let markdown = `# ${session.topic}\n\n`;

    markdown += `## Unterhaltung\n\n`;

    filteredMessages.forEach(msg => {
      const roleLabel = msg.role === 'user' ? 'Du' : msg.role === 'assistant' ? 'KI-Assistent' : 'System';
      markdown += `### ${roleLabel}\n\n${msg.content}\n\n`;
    });

    if (session.codeSnippets.length > 0) {
      markdown += `## Code-Snippets\n\n`;

      session.codeSnippets.forEach(snippet => {
        markdown += `### ${snippet.purpose}\n\n`;
        markdown += `Sprache: ${snippet.language}\n\n`;
        markdown += '```' + snippet.language + '\n';
        markdown += snippet.code + '\n';
        markdown += '```\n\n';
      });
    }

    return markdown;
  }

  /**
   * Session als Text formatieren
   */
  private formatSessionAsText(session: InteractiveSessionState, options: SharingOptions): string {
    const { includeSystemMessages = false } = options;

    // Optional Systemrollen filtern
    const filteredMessages = includeSystemMessages
      ? session.messages
      : session.messages.filter(msg => msg.role !== 'system');

    // Text generieren
    let text = `${session.topic}\n\n`;

    text += `UNTERHALTUNG\n\n`;

    filteredMessages.forEach(msg => {
      const roleLabel = msg.role === 'user' ? 'Du' : msg.role === 'assistant' ? 'KI-Assistent' : 'System';
      text += `${roleLabel}:\n${msg.content}\n\n`;
    });

    if (session.codeSnippets.length > 0) {
      text += `CODE-SNIPPETS\n\n`;

      session.codeSnippets.forEach(snippet => {
        text += `${snippet.purpose}\n`;
        text += `Sprache: ${snippet.language}\n`;
        text += `${snippet.code}\n\n`;
      });
    }

    return text;
  }
}

export default new SharingService();