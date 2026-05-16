const axios = require('axios');

class ApiService {
    async callExternalApi(url, method = 'GET', headers = {}, data = null) {
        try {
            const response = await axios({
                method,
                url,
                headers,
                data
            });
            return response.data;
        } catch (error) {
            throw new Error(`External API call failed: ${error.message}`);
        }
    }
}

module.exports = new ApiService();