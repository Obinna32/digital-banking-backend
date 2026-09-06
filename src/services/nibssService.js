import axios from 'axios';

const getClient = () => {
    return axios.create({
        baseURL: process.env.NIBSS_BASE_URL,
        headers: {
            'Content-Type': 'application/json',
            'x-client-id': process.env.NIBSS_CLIENT_ID,
            'x-client-secret': process.env.NIBSS_CLIENT_SECRET
        }
    });
};

//Initial Onboarding Request to get credentials
export const nibssDeveloperOnboarding = async(email, companyName) => {
    const response = await axios.post(`${process.env.NIBSS_BASE_URL}/onboard`, {email, companyName});
    return response.data;
};

//BVN/NIN Onboardin Verification
export const nibssVerifyIdentity = async (type, number) => {
    const client = getClient();
    const endpoint = type === 'BVN' ? '/verify-bvn' : '/verify-nin';
    const response = await client.post(endpoint, { [type.toLowerCase()]: number});
    return response.data;
};

//Name Enquiry
export const nibssNameEnquiry = async (accountNumber, bankCode) => {
    const client = getClient();
    const response = await client.post('/name-enquiry', { accountNumber, bankCode});
    return response.data;
}

//Inter-bank Transfer
export const nibssInterBankTransfer = async (payload) => {
    const client = getClient();
    const response = await client.post('/transfer/inter-bank', payload);
    return response.data;
};