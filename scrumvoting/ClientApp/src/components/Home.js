import { Avatar, Box, Button, Container, TextField, Typography } from "@mui/material";
import { blue } from "@mui/material/colors";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import * as signalR from "@microsoft/signalr";
import { useEffect, useState } from "react";
import { postUser } from "../api";

export default function Home() {
	const navigate = useNavigate();

	const hubUrl = process.env.REACT_APP_HUB_URL;
	const apiUrl = process.env.REACT_APP_API_URL;

	const [sessionExists, setSessionExists] = useState(true);
	const [username, setUsername] = useState('');
	const [error, setError] = useState(false);

	useEffect(() => {
		// Initialize SignalR connection
		const signalRConnection = initializeSignalR();

		checkActiveSession();

        // Clean up the connection when the component unmounts
        return () => {
            signalRConnection.stop();
        };
    }, []);

	// Function to initialize SignalR connection
	const initializeSignalR = () => {
		const connection = new signalR.HubConnectionBuilder()
			.withUrl(hubUrl)
			.build();

		connection.start()
			.then(() => {
                // SignalR connection established
			})
			.catch((error) => {
				console.error("SignalR connection error: " + error);
			});

		connection.on("ReceiveSessionExists", (activeSessionExists) => {
			setSessionExists(activeSessionExists);
		});

		return connection; // Return the connection for cleanup
	};

	const checkActiveSession = async () => {
		const endpoint = apiUrl + '/session/active';

		try {
			const response = await axios.get(endpoint);
			setSessionExists(response.data);
		} catch (error) {
			console.log(error);
		}
	}

	const handleChange = (e) => {
		const inputValue = e.target.value;
		setUsername(inputValue);
		setError(inputValue.trim() === '');
	}

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (error) return;
		await postUser(username.trim());

		// Only navigate after the POST request is complete
		navigate(`/voting?username=${username}`);
	}

	return (
		<Container component="main" maxWidth="xs">
			<Box
				sx={{
				marginTop: 8,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				}}
			>
				<Avatar sx={{ m: 2, bgcolor: blue[700] }} />
				<Typography component="h1" variant="h5">
					Voting Session
				</Typography>
				<Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
					<TextField
						margin="normal"
						fullWidth
						label="Username"
						name="username"
						autoComplete="no"
						autoFocus
						value={username}
						onChange={handleChange}
						error={error}
						helperText={error && 'Username is required'}
					/>
					<Button
						type="submit"
						fullWidth
						variant="contained"
						sx={{ mt: 1 }}
					>
						{sessionExists ? 'Join' : 'Create'}
					</Button>
				</Box>
			</Box>
		</Container>
	);
}

