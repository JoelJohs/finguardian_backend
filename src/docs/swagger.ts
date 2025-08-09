import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJSDoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'FinGuardian API',
            version: '1.0.0',
            description: 'Backend para control financiero personal',
        },
        servers: [{ url: 'http://localhost:3001' }],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: ['src/routes/*.ts'], // escanea anotaciones JSDoc
};

const specs = swaggerJSDoc(options);

export function setupSwagger(app: any) {
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));
}