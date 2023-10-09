import axios from "axios";

export const postUser = (username) => {
    const apiUrl = process.env.REACT_APP_API_URL;

    const endpoint = apiUrl + '/session/users?username=' + username;

    axios.post(endpoint, username)
        .then((response) => {
        })
        .catch((error) => {
            console.log(error);
        });
}