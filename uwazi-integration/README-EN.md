# Uwazi Integration for Human Rights Intelligence

This documentation describes the implementation of the Uwazi integration in our Human Rights Intelligence application.

## Overview

Uwazi is a flexible database platform developed by HURIDOCS specifically for human rights organizations. Our integration enables seamless data exchange between the Human Rights Intelligence App and Uwazi-based document collections.

## Main Integration Components

### 1. Data Model

The integration synchronizes the following data types:
- Documents and metadata
- Entities (persons, organizations, events)
- Thesauri (controlled vocabularies)
- Relationships between entities
- Permissions and access rights

### 2. API Integration

The integration is performed via the RESTful APIs of Uwazi:
- Document endpoints (`/api/documents`)
- Entity endpoints (`/api/entities`)
- Search endpoints (`/api/search`)
- Thesauri endpoints (`/api/thesauri`)

### 3. Authentication

The application uses JWT-based authentication for secure communication with Uwazi instances.

### 4. Data Synchronization

The application supports:
- Bidirectional synchronization between Uwazi and the app
- Offline capabilities with conflict resolution
- Incremental updates

### 5. AI Integration

The Human Rights Intelligence App enhances Uwazi with:
- Document analysis using Gemini and OpenAI
- Automatic pattern detection in human rights violations
- Intelligent content generation for reports
- Multi-agent coordination for complex workflows

## Implementation Details

### Mobile App Integration

The Mobile App communicates with Uwazi through:
1. REST API calls for online operations
2. SQLite database for offline storage
3. Synchronization logic for bidirectional updates

### Data Model Mapping

Our application maps the MongoDB schema of Uwazi to relational structures:
- Documents → documents table
- Entities → entities table
- Relationships → relationships table

### Multi-Tenancy Support

The integration supports multi-tenancy:
- Connection to multiple Uwazi instances
- Isolation of data between different tenants
- Configurable API endpoints per tenant

## API Usage Examples

Example for fetching documents:
```typescript
const fetchUwaziDocuments = async (query) => {
  const response = await uwaziAPI.get('/api/documents', {
    params: {
      searchTerm: query,
      fields: ['title', 'creationDate', 'sharedId']
    }
  });
  return response.data.rows;
};
```

Example for creating an entity:
```typescript
const createUwaziEntity = async (entity) => {
  const response = await uwaziAPI.post('/api/entities', {
    entity: {
      title: entity.title,
      template: entity.templateId,
      metadata: entity.metadata
    }
  });
  return response.data;
};
```

## Technical Requirements

The integration requires:
- MongoDB connection (for full functionality)
- ElasticSearch connection (for search)
- Uwazi API access with appropriate permissions

## Configuration Options

The integration can be configured via:
- Environment variables
- Configuration files
- API keys and secrets

## Known Limitations

- Offline synchronization supports only basic features
- Full functionality requires an active internet connection
- Complex relationship networks are only partially supported