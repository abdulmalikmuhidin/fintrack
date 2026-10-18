import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';

// Load env files first so MONGODB_URI is available at module-definition time
import { config } from 'dotenv';
config({ path: ['.env.local', '.env'] });

const mongoUri = process.env.MONGODB_URI;

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env.local', '.env'],
        }),
        ...(mongoUri
            ? [
                MongooseModule.forRootAsync({
                    imports: [ConfigModule],
                    useFactory: (configService: ConfigService) => ({
                        uri: configService.get<string>('MONGODB_URI'),
                        connectionFactory: (connection) => {
                            const logger = new Logger('MongoDB');
                            if (connection.readyState === 1) {
                                logger.log('Successfully connected to MongoDB');
                            }
                            connection.on('connected', () =>
                                logger.log('Successfully connected to MongoDB'),
                            );
                            connection.on('error', (err: Error) =>
                                logger.error(`MongoDB connection error: ${err.message}`),
                            );
                            return connection;
                        },
                    }),
                    inject: [ConfigService],
                }),
            ]
            : []),
        HealthModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }