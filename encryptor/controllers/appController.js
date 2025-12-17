const { execFile } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');

const check = (req, res) => {
    const { registrationNumber, birthDate } = req.body;

    if (typeof registrationNumber !== 'string' || typeof birthDate !== 'string') {
        return res.status(400).json({ error: 'data must be string' });
    }

    if (!/^\d+$/.test(registrationNumber)) {
        return res.status(400).json({ 
            status: 'not_found',
            message: 'Invalid registration number format' 
        });
    }

    const filePath = `/home/encryptor/service/users/${registrationNumber}.json`;

    execFile('cat', [filePath], (error, stdout, stderr) => {
        if (error) {
            console.error('Exec error:', error);
            return res.status(400).json({ 
                status: 'not_found',
                message: 'Registration number not found' 
            });
        }

        try {
            const userData = JSON.parse(stdout);
            if (birthDate && userData.birthdate !== birthDate) {
                console.log(`Birth date mismatch for ${registrationNumber}`);
                return res.status(200).json({ 
                    status: 'not_found',
                    message: 'birth date not found' 
                });
            }

            return res.status(200).json({ 
                status: 'accepted',
                data: userData
            });
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            return res.status(500).json({ 
                error: 'Invalid user data format',
                message: parseError.message 
            });
        }
    });
};

module.exports = {check}