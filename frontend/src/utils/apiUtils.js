// src/utils/apiUtils.js

// معالجة الأخطاء من APIs
export const handleApiError = (error, context = 'API') => {
  console.error(`${context} Error:`, error);
  
  if (error.response) {
    // الخطأ من الخادم مع كود حالة
    return {
      message: `Server error: ${error.response.status} - ${error.response.statusText}`,
      status: error.response.status,
      data: error.response.data
    };
  } else if (error.request) {
    // تم إجراء الطلب ولكن لم يتم استقبال الرد
    return {
      message: 'Network error: No response received from server',
      status: null,
      isNetworkError: true
    };
  } else {
    // خطأ أثناء إعداد الطلب
    return {
      message: `Request error: ${error.message}`,
      status: null
    };
  }
};

// إنشاء headers للطلبات
export const createHeaders = (contentType = 'application/json', additionalHeaders = {}) => {
  const headers = {
    'Content-Type': contentType,
    ...additionalHeaders
  };
  
  return headers;
};

// طلب fetch مع التعامل مع الأخطاء
export const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(id);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

// التحقق من صحة JSON
export const safeJsonParse = (str, defaultValue = null) => {
  try {
    return JSON.parse(str);
  } catch (error) {
    console.error('JSON parse error:', error);
    return defaultValue;
  }
};

// إعادة المحاولة التلقائية
export const retryOperation = async (operation, maxRetries = 3, delay = 2000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
};