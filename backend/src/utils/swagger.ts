// src/config/swagger.ts
import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Job In Tech API Documentation",
      version: "1.0.0",
      description: "Documentation professionnelle pour l'API BPMS",
      contact: {
        name: "Dev Team",
      },
    },
    servers: [
      {
        url: "http://localhost:3000/api", // L'URL de base de ton API
        description: "Serveur de Développement",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Hna fin kay-mchi y9ra les fichiers bach yjbad documentation
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"], 
};

export const swaggerSpec = swaggerJsdoc(options);