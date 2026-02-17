"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const path_1 = require("path");
const fs_1 = require("fs");
const app_module_1 = require("./app.module");
const express = require("express");
async function bootstrap() {
    const uploadsDir = (0, path_1.join)(process.cwd(), 'uploads');
    const avatarsDir = (0, path_1.join)(uploadsDir, 'avatars');
    if (!(0, fs_1.existsSync)(uploadsDir))
        (0, fs_1.mkdirSync)(uploadsDir, { recursive: true });
    if (!(0, fs_1.existsSync)(avatarsDir))
        (0, fs_1.mkdirSync)(avatarsDir, { recursive: true });
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use('/uploads', express.static(uploadsDir));
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.enableCors({ origin: true, credentials: true });
    const port = process.env.PORT ?? 3001;
    await app.listen(port);
    console.log(`Backend running on http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map