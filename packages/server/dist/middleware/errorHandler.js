export class AppError extends Error {
    statusCode;
    code;
    constructor(message, statusCode, code) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
export function errorHandler(err, req, res, next) {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            error: err.message,
            code: err.code,
        });
    }
    console.error('Unexpected error:', err);
    res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
    });
}
