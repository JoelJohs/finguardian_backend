import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJSDoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'FinGuardian API',
            version: '1.0.0',
            description: 'Backend para control financiero personal',
            contact: {
                name: 'FinGuardian Team',
                email: 'support@finguardian.com'
            }
        },
        servers: [
            { url: 'http://localhost:3001', description: 'Desarrollo' },
            { url: 'https://api.finguardian.com', description: 'Producción' }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Token JWT obtenido al hacer login (para retrocompatibilidad)'
                },
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'authToken',
                    description: 'Token JWT almacenado en cookie httpOnly (método recomendado)'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid', description: 'ID único del usuario' },
                        username: { type: 'string', description: 'Nombre de usuario único' },
                        email: { type: 'string', format: 'email', description: 'Email del usuario' },
                        currency: { type: 'string', default: 'USD', description: 'Moneda preferida' },
                        created_at: { type: 'string', format: 'date-time', description: 'Fecha de creación' }
                    }
                },
                Transaction: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid', description: 'ID único de la transacción' },
                        amount: { type: 'number', format: 'decimal', description: 'Monto de la transacción' },
                        description: { type: 'string', nullable: true, description: 'Descripción opcional' },
                        type: { type: 'string', enum: ['income', 'expense'], description: 'Tipo de transacción' },
                        category: { $ref: '#/components/schemas/Category' },
                        createdAt: { type: 'string', format: 'date-time', description: 'Fecha de creación' }
                    }
                },
                Category: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', description: 'ID único de la categoría' },
                        name: { type: 'string', description: 'Nombre de la categoría' },
                        type: { type: 'string', enum: ['income', 'expense'], description: 'Tipo de categoría' }
                    }
                },
                Budget: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid', description: 'ID único del presupuesto' },
                        limit: { type: 'number', format: 'decimal', description: 'Límite del presupuesto' },
                        period: { type: 'string', enum: ['monthly', 'weekly'], description: 'Período del presupuesto' },
                        category: { $ref: '#/components/schemas/Category' },
                        createdAt: { type: 'string', format: 'date-time', description: 'Fecha de creación' }
                    }
                },
                SavingsGoal: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid', description: 'ID único de la meta' },
                        name: { type: 'string', description: 'Nombre de la meta' },
                        target: { type: 'number', format: 'decimal', description: 'Monto objetivo' },
                        current: { type: 'number', format: 'decimal', default: 0, description: 'Monto actual' },
                        deadline: { type: 'string', format: 'date', nullable: true, description: 'Fecha límite' },
                        createdAt: { type: 'string', format: 'date-time', description: 'Fecha de creación' }
                    }
                },
                TransactionDTO: {
                    type: 'object',
                    required: ['amount', 'categoryId', 'type'],
                    properties: {
                        amount: { type: 'number', format: 'decimal', description: 'Monto de la transacción' },
                        categoryId: { type: 'integer', description: 'ID de la categoría' },
                        description: { type: 'string', description: 'Descripción opcional' },
                        type: { type: 'string', enum: ['income', 'expense'], description: 'Tipo de transacción' }
                    }
                },
                BudgetDTO: {
                    type: 'object',
                    required: ['limit', 'categoryId', 'period'],
                    properties: {
                        limit: { type: 'number', format: 'decimal', description: 'Límite del presupuesto' },
                        categoryId: { type: 'integer', description: 'ID de la categoría' },
                        period: { type: 'string', enum: ['monthly', 'weekly'], description: 'Período del presupuesto' }
                    }
                },
                SavingsGoalDTO: {
                    type: 'object',
                    required: ['name', 'target'],
                    properties: {
                        name: { type: 'string', description: 'Nombre de la meta' },
                        target: { type: 'number', format: 'decimal', description: 'Monto objetivo' },
                        deadline: { type: 'string', format: 'date', description: 'Fecha límite opcional' }
                    }
                },
                LoginRequest: {
                    type: 'object',
                    required: ['username', 'password'],
                    properties: {
                        username: { type: 'string', description: 'Nombre de usuario' },
                        password: { type: 'string', description: 'Contraseña' }
                    }
                },
                RegisterRequest: {
                    type: 'object',
                    required: ['username', 'email', 'password'],
                    properties: {
                        username: { type: 'string', description: 'Nombre de usuario único' },
                        email: { type: 'string', format: 'email', description: 'Email del usuario' },
                        password: { type: 'string', minLength: 6, description: 'Contraseña (mínimo 6 caracteres)' }
                    }
                },
                AuthResponse: {
                    type: 'object',
                    properties: {
                        message: { type: 'string', description: 'Mensaje de respuesta' },
                        token: { type: 'string', description: 'Token JWT' },
                        user: { $ref: '#/components/schemas/User' }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'string', description: 'Mensaje de error' },
                        message: { type: 'string', description: 'Descripción del error' }
                    }
                },
                PaginatedResponse: {
                    type: 'object',
                    properties: {
                        data: { type: 'array', items: {} },
                        pagination: {
                            type: 'object',
                            properties: {
                                page: { type: 'integer', description: 'Página actual' },
                                total: { type: 'integer', description: 'Total de elementos' },
                                pages: { type: 'integer', description: 'Total de páginas' }
                            }
                        }
                    }
                },
                DashboardSummary: {
                    type: 'object',
                    properties: {
                        totalIncome: { type: 'number', format: 'decimal', description: 'Total de ingresos' },
                        totalExpenses: { type: 'number', format: 'decimal', description: 'Total de gastos' },
                        balance: { type: 'number', format: 'decimal', description: 'Balance (ingresos - gastos)' },
                        transactionCount: { type: 'integer', description: 'Número de transacciones' },
                        categorySummary: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    category: { type: 'string', description: 'Nombre de categoría' },
                                    total: { type: 'number', format: 'decimal', description: 'Total por categoría' }
                                }
                            }
                        }
                    }
                }
            }
        },
        tags: [
            { name: 'Auth', description: 'Autenticación y registro de usuarios' },
            { name: 'Transactions', description: 'Gestión de transacciones' },
            { name: 'Budgets', description: 'Gestión de presupuestos' },
            { name: 'Savings', description: 'Gestión de metas de ahorro' },
            { name: 'Dashboard', description: 'Resúmenes y estadísticas' },
            { name: 'Reports', description: 'Reportes y exportación' },
            { name: 'Notifications', description: 'Gestión de notificaciones' },
            { name: 'Lifetime', description: 'Ahorros de por vida' }
        ]
    },
    apis: ['src/routes/*.ts'], // escanea anotaciones JSDoc
};

const specs = swaggerJSDoc(options);

export function setupSwagger(app: any) {
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));
}