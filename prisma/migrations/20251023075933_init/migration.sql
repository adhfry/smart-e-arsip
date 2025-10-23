-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_lengkap` VARCHAR(100) NOT NULL,
    `username` VARCHAR(50) NOT NULL,
    `phone` VARCHAR(15) NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('admin', 'staf_tu', 'pimpinan', 'staf_bidang') NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_phone_key`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `surat_masuk` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `no_surat_asal` VARCHAR(100) NOT NULL,
    `tgl_surat` DATE NOT NULL,
    `tgl_diterima` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `perihal` TEXT NOT NULL,
    `asal_surat` VARCHAR(150) NOT NULL,
    `file_url` VARCHAR(255) NOT NULL,
    `id_pencatat_user` INTEGER NOT NULL,
    `ringkasan_ai` TEXT NULL,
    `adalah_undangan` BOOLEAN NOT NULL DEFAULT false,
    `detail_rapat_json` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `surat_keluar` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `no_surat_keluar` VARCHAR(100) NOT NULL,
    `tgl_surat` DATE NOT NULL,
    `perihal` TEXT NOT NULL,
    `tujuan` VARCHAR(150) NOT NULL,
    `file_url` VARCHAR(255) NOT NULL,
    `id_pembuat_user` INTEGER NOT NULL,

    UNIQUE INDEX `surat_keluar_no_surat_keluar_key`(`no_surat_keluar`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `disposisi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_surat_masuk` INTEGER NOT NULL,
    `id_pimpinan_user` INTEGER NOT NULL,
    `id_tujuan_user` INTEGER NOT NULL,
    `instruksi` TEXT NOT NULL,
    `tgl_disposisi` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('Menunggu', 'Dikerjakan', 'Selesai') NOT NULL DEFAULT 'Menunggu',

    UNIQUE INDEX `disposisi_id_surat_masuk_key`(`id_surat_masuk`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `surat_masuk` ADD CONSTRAINT `surat_masuk_id_pencatat_user_fkey` FOREIGN KEY (`id_pencatat_user`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `surat_keluar` ADD CONSTRAINT `surat_keluar_id_pembuat_user_fkey` FOREIGN KEY (`id_pembuat_user`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `disposisi` ADD CONSTRAINT `disposisi_id_surat_masuk_fkey` FOREIGN KEY (`id_surat_masuk`) REFERENCES `surat_masuk`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `disposisi` ADD CONSTRAINT `disposisi_id_pimpinan_user_fkey` FOREIGN KEY (`id_pimpinan_user`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `disposisi` ADD CONSTRAINT `disposisi_id_tujuan_user_fkey` FOREIGN KEY (`id_tujuan_user`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
