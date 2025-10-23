"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seeding...');
    // Hash password untuk semua user (gunakan password yang sama untuk development)
    const defaultPassword = await bcrypt.hash('Password123!', 10);
    // Data users - Kelompok Smart E-Arsip
    const users = [
        {
            nama_lengkap: 'Ahda Ahda',
            username: 'ahda.admin',
            email: 'ahda@smartearsip.id',
            phone: '081234567891',
            password: defaultPassword,
            role: client_1.Role.admin,
            isActive: true,
        },
        {
            nama_lengkap: 'Ammaru',
            username: 'ammaru.tu',
            email: 'ammaru@smartearsip.id',
            phone: '081234567892',
            password: defaultPassword,
            role: client_1.Role.staf_tu,
            isActive: true,
        },
        {
            nama_lengkap: 'Kholifah',
            username: 'kholifah.tu',
            email: 'kholifah@smartearsip.id',
            phone: '081234567893',
            password: defaultPassword,
            role: client_1.Role.staf_tu,
            isActive: true,
        },
        {
            nama_lengkap: 'Mariana Herawan',
            username: 'mariana.pimpinan',
            email: 'mariana@smartearsip.id',
            phone: '081234567894',
            password: defaultPassword,
            role: client_1.Role.pimpinan,
            isActive: true,
        },
        {
            nama_lengkap: 'Suaidi Ali',
            username: 'suaidi.bidang',
            email: 'suaidi@smartearsip.id',
            phone: '081234567895',
            password: defaultPassword,
            role: client_1.Role.staf_bidang,
            isActive: true,
        },
        {
            nama_lengkap: 'Pia',
            username: 'pia.bidang',
            email: 'pia@smartearsip.id',
            phone: '081234567896',
            password: defaultPassword,
            role: client_1.Role.staf_bidang,
            isActive: true,
        },
        {
            nama_lengkap: 'Safitorulhaniyah',
            username: 'safitorul.bidang',
            email: 'safitorul@smartearsip.id',
            phone: '081234567897',
            password: defaultPassword,
            role: client_1.Role.staf_bidang,
            isActive: true,
        },
    ];
    console.log('\n👥 Creating users...');
    for (const userData of users) {
        try {
            const user = await prisma.user.upsert({
                where: { username: userData.username },
                update: userData,
                create: userData,
            });
            console.log(`✅ Created/Updated: ${user.nama_lengkap} (@${user.username}) - ${user.role}`);
        }
        catch (error) {
            console.error(`❌ Error creating user ${userData.username}:`, error);
        }
    }
    console.log('\n📊 Seeding Summary:');
    const totalUsers = await prisma.user.count();
    const adminCount = await prisma.user.count({ where: { role: client_1.Role.admin } });
    const stafTuCount = await prisma.user.count({ where: { role: client_1.Role.staf_tu } });
    const pimpinanCount = await prisma.user.count({ where: { role: client_1.Role.pimpinan } });
    const stafBidangCount = await prisma.user.count({ where: { role: client_1.Role.staf_bidang } });
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                    SEEDING COMPLETED! ✅                      ║
╠═══════════════════════════════════════════════════════════════╣
║  Total Users:      ${totalUsers.toString().padEnd(43)} ║
║  Admin:            ${adminCount.toString().padEnd(43)} ║
║  Staf TU:          ${stafTuCount.toString().padEnd(43)} ║
║  Pimpinan:         ${pimpinanCount.toString().padEnd(43)} ║
║  Staf Bidang:      ${stafBidangCount.toString().padEnd(43)} ║
╠═══════════════════════════════════════════════════════════════╣
║  Default Password: Password123!                               ║
╠═══════════════════════════════════════════════════════════════╣
║  Login Credentials:                                           ║
║                                                               ║
║  👤 Admin:                                                    ║
║     Username: ahda.admin                                      ║
║     Password: Password123!                                    ║
║                                                               ║
║  📝 Staf TU:                                                  ║
║     Username: ammaru.tu / kholifah.tu                         ║
║     Password: Password123!                                    ║
║                                                               ║
║  👔 Pimpinan:                                                 ║
║     Username: mariana.pimpinan                                ║
║     Password: Password123!                                    ║
║                                                               ║
║  📋 Staf Bidang:                                              ║
║     Username: suaidi.bidang / pia.bidang / safitorul.bidang  ║
║     Password: Password123!                                    ║
╚═══════════════════════════════════════════════════════════════╝
  `);
    console.log('\n🚀 You can now login with any of the credentials above!');
    console.log('📚 API Documentation: http://localhost:3005/api/docs\n');
}
main()
    .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
