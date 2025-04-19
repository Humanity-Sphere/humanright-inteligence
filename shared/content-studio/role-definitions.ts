/**
 * Rollendefinitionen und Berechtigungsmodell für das Content Creation Studio
 */

export interface RoleDefinition {
  id: string;
  name: Record<string, string>;
  description: Record<string, string>;
  permissions: string[];
  aiModels: string[];
  maxTokensPerRequest: number;
  promptChainDepth: number;
  systemPromptAccess: boolean;
  apiSystemAccess: boolean;
  specializedTemplates?: string[];
}

export interface UserWithRoles {
  id: number | string;
  roles: string[];
  [key: string]: any;
}

export const roles: Record<string, RoleDefinition> = {
  administrator: {
    id: 'administrator',
    name: {
      de: 'Administrator',
      en: 'Administrator'
    },
    description: {
      de: 'Vollständiger Zugriff auf alle Funktionen des Content Creation Studios, einschließlich Nutzer- und Systemverwaltung.',
      en: 'Complete access to all Content Creation Studio functions, including user and system management.'
    },
    permissions: [
      'studio.access',
      'studio.templates.view',
      'studio.templates.create',
      'studio.templates.edit',
      'studio.templates.delete',
      'studio.prompts.view',
      'studio.prompts.create',
      'studio.prompts.edit',
      'studio.prompts.delete',
      'studio.roles.manage',
      'studio.users.manage',
      'studio.settings.manage',
      'studio.audit.view',
      'api.quota.manage',
      'system.backup'
    ],
    aiModels: ['all'],
    maxTokensPerRequest: 100000,
    promptChainDepth: 10,
    systemPromptAccess: true,
    apiSystemAccess: true
  },
  
  contentManager: {
    id: 'contentManager',
    name: {
      de: 'Content-Manager',
      en: 'Content Manager'
    },
    description: {
      de: 'Verantwortlich für die Verwaltung von Inhaltsvorlagen und Workflows, kann Templates und Prompt-Bibliotheken erstellen und bearbeiten.',
      en: 'Responsible for managing content templates and workflows, can create and edit templates and prompt libraries.'
    },
    permissions: [
      'studio.access',
      'studio.templates.view',
      'studio.templates.create',
      'studio.templates.edit',
      'studio.prompts.view',
      'studio.prompts.create',
      'studio.prompts.edit',
      'studio.content.manage',
      'studio.workflow.manage'
    ],
    aiModels: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku', 'gemini-2.5-pro', 'gemini-1.5-pro'],
    maxTokensPerRequest: 50000,
    promptChainDepth: 7,
    systemPromptAccess: true,
    apiSystemAccess: false
  },
  
  contentCreator: {
    id: 'contentCreator',
    name: {
      de: 'Content-Ersteller',
      en: 'Content Creator'
    },
    description: {
      de: 'Erstellt und bearbeitet Inhalte mit vordefinierten Templates und Workflows.',
      en: 'Creates and edits content using predefined templates and workflows.'
    },
    permissions: [
      'studio.access',
      'studio.templates.view',
      'studio.prompts.view',
      'studio.content.create',
      'studio.content.edit',
      'studio.content.delete'
    ],
    aiModels: ['claude-3-sonnet', 'claude-3-haiku', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    maxTokensPerRequest: 30000,
    promptChainDepth: 3,
    systemPromptAccess: false,
    apiSystemAccess: false
  },
  
  researcher: {
    id: 'researcher',
    name: {
      de: 'Forscher',
      en: 'Researcher'
    },
    description: {
      de: 'Spezialisiert auf Forschungsaufgaben, Datenanalyse und Informationsbeschaffung.',
      en: 'Specialized in research tasks, data analysis, and information gathering.'
    },
    permissions: [
      'studio.access',
      'studio.templates.view',
      'studio.prompts.view',
      'studio.research.conduct',
      'studio.content.create',
      'studio.content.edit'
    ],
    aiModels: ['claude-3-opus', 'claude-3-sonnet', 'gemini-2.5-pro', 'gemini-1.5-pro'],
    maxTokensPerRequest: 40000,
    promptChainDepth: 5,
    systemPromptAccess: false,
    apiSystemAccess: false,
    specializedTemplates: ['research', 'analysis', 'data_processing']
  },
  
  advocate: {
    id: 'advocate',
    name: {
      de: 'Advokat',
      en: 'Advocate'
    },
    description: {
      de: 'Spezialisiert auf Kampagnen, öffentliche Kommunikation und Stakeholder-Engagement.',
      en: 'Specialized in campaigns, public communications, and stakeholder engagement.'
    },
    permissions: [
      'studio.access',
      'studio.templates.view',
      'studio.prompts.view',
      'studio.content.create',
      'studio.content.edit',
      'studio.advocacy.plan'
    ],
    aiModels: ['claude-3-sonnet', 'claude-3-haiku', 'gemini-1.5-pro'],
    maxTokensPerRequest: 30000,
    promptChainDepth: 3,
    systemPromptAccess: false,
    apiSystemAccess: false,
    specializedTemplates: ['advocacy', 'communication', 'social_media']
  },
  
  legalExpert: {
    id: 'legalExpert',
    name: {
      de: 'Rechtsexperte',
      en: 'Legal Expert'
    },
    description: {
      de: 'Spezialisiert auf rechtliche Analysen, Dokumentenerstellung und juristische Forschung.',
      en: 'Specialized in legal analysis, document creation, and legal research.'
    },
    permissions: [
      'studio.access',
      'studio.templates.view',
      'studio.prompts.view',
      'studio.content.create',
      'studio.content.edit',
      'studio.legal.analyze'
    ],
    aiModels: ['claude-3-opus', 'claude-3-sonnet', 'gemini-2.5-pro'],
    maxTokensPerRequest: 40000,
    promptChainDepth: 4,
    systemPromptAccess: false,
    apiSystemAccess: false,
    specializedTemplates: ['legal', 'documentation', 'case_preparation']
  },
  
  reviewer: {
    id: 'reviewer',
    name: {
      de: 'Prüfer',
      en: 'Reviewer'
    },
    description: {
      de: 'Prüft und genehmigt Inhalte, kann keine neuen Inhalte erstellen, aber bestehende bearbeiten und validieren.',
      en: 'Reviews and approves content, cannot create new content but can edit and validate existing content.'
    },
    permissions: [
      'studio.access',
      'studio.templates.view',
      'studio.prompts.view',
      'studio.content.view',
      'studio.content.edit',
      'studio.content.approve',
      'studio.quality.check'
    ],
    aiModels: ['claude-3-sonnet', 'gemini-1.5-pro'],
    maxTokensPerRequest: 20000,
    promptChainDepth: 2,
    systemPromptAccess: false,
    apiSystemAccess: false
  },
  
  viewer: {
    id: 'viewer',
    name: {
      de: 'Betrachter',
      en: 'Viewer'
    },
    description: {
      de: 'Kann Inhalte nur einsehen, aber nicht erstellen oder bearbeiten.',
      en: 'Can only view content, not create or edit it.'
    },
    permissions: [
      'studio.access',
      'studio.templates.view',
      'studio.content.view'
    ],
    aiModels: ['claude-3-haiku', 'gemini-1.5-flash'],
    maxTokensPerRequest: 10000,
    promptChainDepth: 1,
    systemPromptAccess: false,
    apiSystemAccess: false
  }
};

/**
 * Permissions Manager für Content Creation Studio
 */
export class PermissionsManager {
  roles: Record<string, RoleDefinition>;
  customRoles: Record<string, RoleDefinition>;
  
  constructor() {
    this.roles = roles;
    this.customRoles = {};
  }
  
  /**
   * Prüft, ob ein Benutzer eine bestimmte Berechtigung hat
   */
  hasPermission(user: UserWithRoles, permission: string): boolean {
    if (!user || !user.roles) return false;
    
    // Admin hat immer alle Berechtigungen
    if (user.roles.includes('administrator')) return true;
    
    // Prüfe alle Rollen des Benutzers
    return user.roles.some(roleId => {
      const role = this.roles[roleId] || this.customRoles[roleId];
      return role && role.permissions && role.permissions.includes(permission);
    });
  }
  
  /**
   * Prüft, ob ein Benutzer Zugriff auf ein bestimmtes AI-Modell hat
   */
  canUseModel(user: UserWithRoles, modelId: string): boolean {
    if (!user || !user.roles) return false;
    
    // Prüfe alle Rollen des Benutzers
    return user.roles.some(roleId => {
      const role = this.roles[roleId] || this.customRoles[roleId];
      
      if (!role || !role.aiModels) return false;
      
      // 'all' bedeutet Zugriff auf alle Modelle
      if (role.aiModels.includes('all')) return true;
      
      // Spezifisches Modell prüfen
      return role.aiModels.includes(modelId);
    });
  }
  
  /**
   * Ermittelt das Token-Limit für einen Benutzer
   */
  getTokenLimit(user: UserWithRoles): number {
    if (!user || !user.roles) return 0;
    
    // Höchstes Limit aus allen Rollen des Benutzers nehmen
    return Math.max(
      0,
      ...user.roles.map(roleId => {
        const role = this.roles[roleId] || this.customRoles[roleId];
        return role ? (role.maxTokensPerRequest || 0) : 0;
      })
    );
  }
  
  /**
   * Ermittelt die maximal erlaubte Verkettungstiefe für Prompts
   */
  getPromptChainDepth(user: UserWithRoles): number {
    if (!user || !user.roles) return 0;
    
    // Höchste Tiefe aus allen Rollen des Benutzers nehmen
    return Math.max(
      0,
      ...user.roles.map(roleId => {
        const role = this.roles[roleId] || this.customRoles[roleId];
        return role ? (role.promptChainDepth || 0) : 0;
      })
    );
  }
  
  /**
   * Prüft, ob ein Benutzer auf System-Prompts zugreifen kann
   */
  canAccessSystemPrompts(user: UserWithRoles): boolean {
    if (!user || !user.roles) return false;
    
    // Prüfe alle Rollen des Benutzers
    return user.roles.some(roleId => {
      const role = this.roles[roleId] || this.customRoles[roleId];
      return role && role.systemPromptAccess === true;
    });
  }
  
  /**
   * Fügt eine benutzerdefinierte Rolle hinzu
   */
  addCustomRole(role: RoleDefinition): void {
    if (!role || !role.id) {
      throw new Error('Rolle muss eine ID haben');
    }
    
    this.customRoles[role.id] = role;
  }
  
  /**
   * Aktualisiert eine benutzerdefinierte Rolle
   */
  updateCustomRole(roleId: string, updates: Partial<RoleDefinition>): boolean {
    if (!this.customRoles[roleId]) {
      return false;
    }
    
    this.customRoles[roleId] = {
      ...this.customRoles[roleId],
      ...updates
    };
    
    return true;
  }
  
  /**
   * Löscht eine benutzerdefinierte Rolle
   */
  deleteCustomRole(roleId: string): boolean {
    if (!this.customRoles[roleId]) {
      return false;
    }
    
    delete this.customRoles[roleId];
    return true;
  }
  
  /**
   * Gibt alle verfügbaren Rollen zurück
   */
  getAllRoles(): Record<string, RoleDefinition> {
    return {
      ...this.roles,
      ...this.customRoles
    };
  }
  
  /**
   * Gibt alle für einen Benutzer verfügbaren Vorlagentypen zurück
   */
  getAvailableTemplateTypes(user: UserWithRoles): string[] {
    if (!user || !user.roles) return [];
    
    const specializedTemplates = new Set<string>();
    
    user.roles.forEach(roleId => {
      const role = this.roles[roleId] || this.customRoles[roleId];
      if (role && role.specializedTemplates) {
        role.specializedTemplates.forEach(template => specializedTemplates.add(template));
      }
    });
    
    return Array.from(specializedTemplates);
  }
}

export default PermissionsManager;