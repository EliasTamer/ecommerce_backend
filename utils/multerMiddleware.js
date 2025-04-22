const multer = require("multer");

function setupMiddleware(path) {
    // configure multer for storage (optional, but recommended for production)
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            // specify the directory where you want to save the uploaded files
            cb(null, path); // create this 'uploads' folder in your project root
        },
        filename: function (req, file, cb) {
            // define how the uploaded file should be named
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const fileExtension = file.originalname.split('.').pop();
            cb(null, file.fieldname + '-' + uniqueSuffix + '.' + fileExtension);
        }
    });

    const upload = multer({ storage: storage });
    return upload;
}

module.exports = setupMiddleware

