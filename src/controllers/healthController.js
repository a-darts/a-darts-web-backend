export const getHealth = (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        message: 'Server is healthy and running smoothly'
    });
};
