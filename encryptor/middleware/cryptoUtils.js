const crypto = require('crypto');

const decryptMiddleware = (req, res, next) => {
    try {
        const secretKey = req.headers['x-secret-key'];
        const secretIV = req.headers['x-secret-iv'];
        if (!secretKey || !secretIV) {
            return res.status(400).json({ 
                error: 'Missing required headers',
                message: 'X-Secret-Key and X-Secret-IV headers are required' 
            });
        }
        if (!req.body || (typeof req.body === 'object' && Object.keys(req.body).length === 0)) {
            return next();
        }
        let key, iv;
        try {
            key = Buffer.from(secretKey, 'base64');
            iv = Buffer.from(secretIV, 'base64');
            if (key.length !== 32) {
                return res.status(400).json({ 
                    error: 'Invalid secret key',
                    message: 'X-Secret-Key must be a base64 encoded 32-byte key' 
                });
            }
            if (iv.length !== 16) {
                return res.status(400).json({ 
                    error: 'Invalid initialization vector',
                    message: 'X-Secret-IV must be a base64 encoded 16-byte IV' 
                });
            }
        } catch (error) {
            return res.status(400).json({ 
                error: 'Invalid header format',
                message: 'Headers must be valid base64 encoded strings' 
            });
        }
        let encryptedData;
        if (typeof req.body === 'string') {
            encryptedData = req.body;
        } else {
            return res.status(400).json({ 
                error: 'Invalid request body format',
                message: 'Request body must contain only encrypted data as base64 string' 
            });
        }
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        try {
            req.body = JSON.parse(decrypted);
        } catch (parseError) {
            req.body = decrypted;
        }
        next();
    } catch (error) {
        console.error('Decryption error:', error.message);
        return res.status(400).json({ 
            error: 'Failed to decrypt request body',
            message: 'Invalid encryption or corrupted data' 
        });
    }
};

const encryptMiddleware = (req, res, next) => {
    const originalJson = res.json;
    const originalSend = res.send;
    res.json = function(data) {
        try {
            const responseKey = crypto.randomBytes(32);
            const responseIV = crypto.randomBytes(16);
            const jsonString = JSON.stringify(data);
            const cipher = crypto.createCipheriv('aes-256-cbc', responseKey, responseIV);
            let encrypted = cipher.update(jsonString, 'utf8', 'base64');
            encrypted += cipher.final('base64');
            res.setHeader('X-Secret-Key', responseKey.toString('base64'));
            res.setHeader('X-Secret-IV', responseIV.toString('base64'));
            res.setHeader('Content-Type', 'text/plain');
            return originalSend.call(this, encrypted);
        } catch (error) {
            console.error('Encryption error:', error.message);
            return originalJson.call(this, { 
                error: 'Failed to encrypt response',
                message: error.message 
            });
        }
    };
    res.send = function(data) {
        if (typeof data === 'string' && data.length > 0 && !res.headersSent) {
            try {
                const responseKey = crypto.randomBytes(32);
                const responseIV = crypto.randomBytes(16);
                const cipher = crypto.createCipheriv('aes-256-cbc', responseKey, responseIV);
                let encrypted = cipher.update(data, 'utf8', 'base64');
                encrypted += cipher.final('base64');
                res.setHeader('X-Secret-Key', responseKey.toString('base64'));
                res.setHeader('X-Secret-IV', responseIV.toString('base64'));
                res.setHeader('Content-Type', 'text/plain');
                return originalSend.call(this, encrypted);
            } catch (error) {
                console.error('Encryption error:', error.message);
                return originalSend.call(this, data);
            }
        }
        return originalSend.call(this, data);
    };
    next();
};

module.exports = {
    decryptMiddleware,
    encryptMiddleware
};
