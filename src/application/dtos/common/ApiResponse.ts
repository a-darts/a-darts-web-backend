// API response structure following JSend docs

type ResponseStatus = 'success' | 'fail' | 'error';

export interface ApiResponse<T> {
    status: ResponseStatus;
    message?: string;
    data?: T;
    code?: number;
}

export class ApiResponseBuilder {
    /*
     * Success: Returns JSON data with status: success
     */
    public static success<T>(data: T, message?: string): ApiResponse<T> {
        return {
            status: 'success',
            message,
            data
        };
    }

    /*
     * Fail: Returns JSON data with status: fail
     *       (for validation or client logic errors)
     */
    public static fail<T>(data: T, message?: string): ApiResponse<T> {
        return {
            status: 'fail',
            message,
            data
        };
    }

    /*
     * Error: Returns JSON data with status: error
     *        (for server logic errors)
     */
    public static error<T>(message: string, code?: number, data?: T): ApiResponse<T> {
        return {
            status: 'error',
            message,
            code
        };
    }
}