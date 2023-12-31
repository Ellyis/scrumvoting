import { Avatar, Box, Button, Container, TextField, Typography } from "@mui/material";
import { blue } from "@mui/material/colors";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { GetIsSessionActive, PostUser } from "../api";
import Notification from "./Notification";
import AddAlertIcon from '@mui/icons-material/AddAlert';

export default function Home({ signalRConnection, setConfirmDialog }) {
	const navigate = useNavigate();
	
	const connectionId = signalRConnection.connection.connectionId;
	
	const [isSessionActive, setIsSessionActive] = useState(true);
	const [username, setUsername] = useState('');
	const [error, setError] = useState(false);
	const [helperText, setHelperText] = useState('');
	const [notify, setNotify] = useState({
		isOpen: false, type: '', message: ''
	})
	
	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await GetIsSessionActive();
				setIsSessionActive(response);
			} catch (error) {
				// Handle errors here
				console.log(error);
			}
		};
		fetchData();
		
		signalRConnection.on("ReceiveSessionExists", (activeSessionExists) => {
			setIsSessionActive(activeSessionExists);
		});
		
		signalRConnection.on("ReceiveAdminConnectionId", (adminConnectionId) => {
			signalRConnection.invoke("SetAdminConnected", adminConnectionId);
		});
		
	}, []);
	
	const handleChange = (e) => {
		const inputValue = e.target.value;
		setUsername(inputValue);
		if (inputValue.trim() === '') {
			setError(true);
			setHelperText('Username is required');
		} else {
			setError(false);
		}
	}
	
	const handleSubmit = (e) => {
		e.preventDefault();
		
		// Username validation
		if (username.trim() === '') {
			setError(true);
			setHelperText('Username is required');
			return;
		}
		
		if (isSessionActive) {
			handleLogin();
		} else {
			setConfirmDialog({
				title: 'Are you sure you want to create a session?',
				subtitle: "You will be the admin for the session.",
				isOpen: true,
				icon: <AddAlertIcon />,
				iconColor: '#1976d2',
				buttonColor: 'primary',
				onConfirm: () => handleLogin()
			})
		}
	}
	
	const handleLogin = async () => {
		const user = await PostUser(username.trim(), connectionId);
		if (user) {
			// Only navigate after the POST request is complete
			navigate(`/voting?username=${username}`);
			localStorage.setItem('username', username);
		} else {
			setError(true);
			setHelperText('Username is already taken');
		}
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
						autoComplete="off"
						autoFocus
						value={username}
						onChange={handleChange}
						error={error}
						helperText={error && helperText}
					/>
					<Button
						type="submit"
						fullWidth
						variant="contained"
						sx={{ mt: 1 }}
					>
						{isSessionActive ? 'Join' : 'Create'}
					</Button>
				</Box>
			</Box>
			
			<Notification 
				notify={notify}
				setNotify={setNotify}
			/>
		</Container>
	);
}

