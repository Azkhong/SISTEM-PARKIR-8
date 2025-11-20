/*
* =================================================================
* SCRIPT GOOGLE APPS UNTUK MENANGANI UPLOAD TUGAS
* =================================================================
*/

// !!! PENTING: GANTI DENGAN ID ANDA !!!
const SPREADSHEET_ID = "1nX5l-l0j_mNiTEmdyDAzE85G53oTyaViyNOlED1JGks"; // ID dari Google Sheet "Log Tugas"
const FOLDER_ID = "1cgeyXoRZ6uI2Fn48aL49JoIWzw8QuxXO"; // ID dari folder Google Drive "Upload Tugas"

// --- KONFIGURASI VALIDASI ---
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
];
// ------------------------------

/**
 * Fungsi ini berjalan ketika pengguna mengakses URL script.
 * Ini akan menampilkan halaman HTML.
 */
function doGet(e) {
  // Menampilkan file HTML 'index.html'
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Form Upload Tugas')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1'); // Pastikan ini sudah benar
}

/**
 * Fungsi ini berjalan ketika formulir HTML mengirim data ke script
 */
function doPost(e) {
  try {
    // 1. Parse data JSON yang dikirim dari HTML
    const data = JSON.parse(e.postData.contents);

    // 2. Ambil data file (Base64) dan informasi lainnya
    const fileData = data.fileData;
    const filename = data.filename;
    const mimeType = data.mimeType;

    // --- VALIDASI SISI SERVER DIMULAI ---

    // Cek jika tidak ada file
    if (!fileData) {
      throw new Error("File tidak ditemukan. Harap pilih file untuk diunggah.");
    }

    // Cek Tipe MIME
    if (ALLOWED_MIME_TYPES.indexOf(mimeType) === -1) {
      throw new Error("Tipe file tidak diizinkan. Hanya .png, .jpg, .pdf, atau .docx.");
    }

    // 3. Dekode Base64
    const decodedData = Utilities.base64Decode(fileData);
    
    // Cek Ukuran File
    const fileSizeInBytes = decodedData.length;
    if (fileSizeInBytes > MAX_FILE_SIZE_BYTES) {
      throw new Error("Ukuran file melebihi batas 10 MB.");
    }

    // --- VALIDASI SISI SERVER SELESAI ---

    // 4. Buat file blob
    const blob = Utilities.newBlob(decodedData, mimeType, filename);

    // 5. Simpan file ke folder Google Drive
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const newFile = folder.createFile(blob);
    const fileUrl = newFile.getUrl();

    // 6. Buka Google Sheet
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheets()[0];
    
    // 7. Kumpulkan data formulir
    const timestamp = new Date();
    const guru = data.guru;
    const mapel = data.mapel;
    const nama = data.nama;
    const absen = data.absen;
    const kelas = data.kelas;
    const deskripsi = data.deskripsi;

    // 8. Tulis data ke Google Sheet
    sheet.appendRow([
      timestamp,
      guru,
      mapel,
      nama,
      absen,
      kelas,
      deskripsi,
      fileUrl // Tambahkan link file ke sheet
    ]);

    // 9. Kirim balasan "sukses" kembali ke HTML
    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", message: "Tugas berhasil diunggah!", fileUrl: fileUrl }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // 10. Kirim balasan "gagal" jika terjadi error
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
