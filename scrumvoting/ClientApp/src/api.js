import axios from "axios";

const apiUrl = process.env.REACT_APP_API_URL;

export const GetIsSessionActive = async () => {
    const endpoint = `${apiUrl}/session/active`;

    try {
        const response = await axios.get(endpoint);
        return response.data
    } catch (error) {
        console.log(error);
    }
}

export const GetToggleShow = async () => {
    const endpoint = `${apiUrl}/session/toggleShow`;

    try {
        const response = await axios.get(endpoint);
        return response.data;
    } catch (error) {
        console.log(error);
    }
}

export const GetUser = async (username) => {
    const endpoint = `${apiUrl}/session/users/${username}`;

    try {
        const response = await axios.get(endpoint);
        return response.data;
        // if (user)
        //     setUser(user);
        // else
        //     navigate('/');
    } catch (error) {
        console.log(error);
    }
};

export const GetRecords = async () => {
    const endpoint = `${apiUrl}/session/users`;

    try {
        const response = await axios.get(endpoint);
        return response.data;
    } catch (error) {
        console.log(error);
    }
};

export const UpdateUser = async (user) => {
    const endpoint = `${apiUrl}/session/users/${user.name}`;

    try {
        const response = await axios.post(endpoint, null, {
            params: {
                points: user.points
            }
        });
        return response.data;
    } catch (error) {
        console.log(error);
    }
};

export const UpdateToggleShow = async (newToggleShow) => {
    const endpoint = `${apiUrl}/session/toggleShow`;

    try {
        const response = await axios.post(endpoint, null, {
            params: {
                toggleShow: newToggleShow
            }
        });
        return response.data;
    } catch (error) {
        console.log(error);
    }
}

export const ResetUserPoints = async () => {
    const endpoint = `${apiUrl}/session/users/reset`;

    try {
        await axios.post(endpoint);
    } catch (error) {
        console.log(error);
    }
}

export const EndSession = async () => {
    const endpoint = `${apiUrl}/session/users`;

    try {
        await axios.delete(endpoint);
    } catch (error) {
        console.log(error);
    }
}

export const PostUser = async (username) => {
    const endpoint = `${apiUrl}/session/users?username=${username}`;

    try {
        const response = await axios.post(endpoint, username);
        return response.data;
    } catch (error) {
        console.log(error);
    }
}