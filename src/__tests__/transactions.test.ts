// src/__tests__/transactions.test.ts
import request from 'supertest';
import { AppDataSource } from '../config/database';
import app from '../server';
import { User } from '../entities/User';
import { Category } from '../entities/Category';
import { Transaction } from '../entities/Transaction';
import { SavingsGoal } from '../entities/SavingsGoal';
import { Budget } from '../entities/Budget';
import { LifetimeSavings } from '../entities/LifetimeSavings';
import { RecurringTransaction } from '../entities/RecurringTransaction';
import bcrypt from 'bcrypt';

describe('Transaction API', () => {
    let testToken: string;
    let testCategoryId: number;

    // Helper function to clean database safely
    const cleanDatabase = async () => {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();

        try {
            // Disable foreign key checks temporarily
            await queryRunner.query('SET session_replication_role = replica;');

            // Truncate all tables
            await queryRunner.query('TRUNCATE TABLE transactions CASCADE;');
            await queryRunner.query('TRUNCATE TABLE savings_goals CASCADE;');
            await queryRunner.query('TRUNCATE TABLE budgets CASCADE;');
            await queryRunner.query('TRUNCATE TABLE lifetime_savings CASCADE;');
            await queryRunner.query('TRUNCATE TABLE recurring_transactions CASCADE;');
            await queryRunner.query('TRUNCATE TABLE users CASCADE;');
            await queryRunner.query('TRUNCATE TABLE categories CASCADE;');

            // Re-enable foreign key checks
            await queryRunner.query('SET session_replication_role = DEFAULT;');
        } catch (error) {
            console.log('Error cleaning database, trying alternative method:', error);
            // Fallback: delete in correct order
            await queryRunner.query('DELETE FROM transactions;');
            await queryRunner.query('DELETE FROM savings_goals;');
            await queryRunner.query('DELETE FROM budgets;');
            await queryRunner.query('DELETE FROM lifetime_savings;');
            await queryRunner.query('DELETE FROM recurring_transactions;');
            await queryRunner.query('DELETE FROM users;');
            await queryRunner.query('DELETE FROM categories;');
        } finally {
            await queryRunner.release();
        }
    };

    beforeAll(async () => {
        // Initialize database connection
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        // Clean database using helper function
        await cleanDatabase();

        // Create test category
        const categoryRepo = AppDataSource.getRepository(Category);
        const testCategory = categoryRepo.create({
            name: 'Test Category',
            type: 'expense',
            icon: '🧪',
            color: '#123456'
        });
        const savedCategory = await categoryRepo.save(testCategory);
        testCategoryId = savedCategory.id;

        // Create test user directly in database
        const userRepo = AppDataSource.getRepository(User);
        const hashedPassword = await bcrypt.hash('testpass123', 10);
        const testUser = userRepo.create({
            username: 'testuser',
            email: 'test@example.com',
            password: hashedPassword,
        });
        await userRepo.save(testUser);

        // Login to get token
        const loginResponse = await request(app)
            .post('/api/users/login')
            .send({
                username: 'testuser',
                password: 'testpass123'
            });

        expect(loginResponse.status).toBe(200);
        testToken = loginResponse.body.token;
    });

    afterAll(async () => {
        // Clean up using helper function
        if (AppDataSource.isInitialized) {
            await cleanDatabase();
            await AppDataSource.destroy();
        }
    });

    describe('POST /api/transactions', () => {
        it('should reject requests without authentication', async () => {
            const response = await request(app)
                .post('/api/transactions')
                .send({
                    amount: 100,
                    categoryId: testCategoryId,
                    type: 'expense',
                    description: 'Test transaction'
                });

            expect(response.status).toBe(401);
        });

        it('should create a transaction successfully', async () => {
            const response = await request(app)
                .post('/api/transactions')
                .set('Authorization', `Bearer ${testToken}`)
                .send({
                    amount: 150.50,
                    categoryId: testCategoryId,
                    type: 'expense',
                    description: 'Test expense transaction'
                });

            expect(response.status).toBe(201);
            expect(response.body.tx).toBeDefined();
            expect(response.body.tx.amount).toBe(150.50);
            expect(response.body.tx.type).toBe('expense');
            expect(response.body.tx.description).toBe('Test expense transaction');
        });

        it('should reject transaction with invalid category', async () => {
            const response = await request(app)
                .post('/api/transactions')
                .set('Authorization', `Bearer ${testToken}`)
                .send({
                    amount: 100,
                    categoryId: 99999, // Non-existent category
                    type: 'expense',
                    description: 'Test transaction'
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Categoría inválida');
        });
    });
});