import { AxiosError } from 'axios';

/**
 * Extracts a user-friendly error message from an Axios error response
 * Prioritizes error details from the server response if available
 */
export const getErrorMessage = (error: unknown): string => {
  // Default error message
  let errorMessage = 'An unexpected error occurred';
  
  if (error instanceof AxiosError) {
    // Check if there's a response with data
    if (error.response?.data) {
      const { data } = error.response;
      
      // Check for details array (as shown in your example)
      if (data.details && Array.isArray(data.details) && data.details.length > 0) {
        return data.details[0]; // Return the first detail message
      }
      
      // Check for a message in the response data
      if (data.message) {
        return data.message;
      }
      
      // Check for error message in the response data
      if (data.error) {
        return data.error;
      }
    }
    
    // If no specific error details found, use the Axios error message
    if (error.message) {
      errorMessage = error.message;
    }
  } else if (error instanceof Error) {
    // Handle regular Error objects
    errorMessage = error.message;
  }
  
  return errorMessage;
}; 