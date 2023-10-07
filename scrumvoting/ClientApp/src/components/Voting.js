import { Button, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material"
import { makeStyles } from "@mui/styles";
import { useLocation, useNavigate } from "react-router-dom";
import * as signalR from "@microsoft/signalr";
import { useEffect, useState } from "react";
import axios from "axios";


const useStyles = makeStyles(theme => ({
	table: {
		'& thead th': {
		fontWeight: '600',
		color: '#333996',
		backgroundColor: '#3c44b126'
		}
	}
}))

export default function Voting() {
	const classes = useStyles();
	const navigate = useNavigate();

	const hubUrl = process.env.REACT_APP_HUB_URL;
	const apiUrl = process.env.REACT_APP_API_URL;

	const location = useLocation();
	const searchParams = new URLSearchParams(location.search);
	const username = searchParams.get('username');

	const [users, setUsers] = useState([]);

	useEffect(() => {
		// Initialize SignalR connection
		const signalRConnection = initializeSignalR();
		setTimeout(() => {
			getUser(username);
			getUsers();
		}, 0)

        // Clean up the connection when the component unmounts
        return () => {
            signalRConnection.stop();
        };
    }, []);

	const getUser = (username) => {
		axios.get(`${apiUrl}/session/users/${username}`)
			.then((response) => {
				const user = response.data;
				if (user)
					console.log(user);
				else
					navigate('/');

			})
			.catch((error) => {
				console.log(error);
			});
	};

	const getUsers = () => {
		axios.get(`${apiUrl}/session/users`)
			.then((response) => {
				setUsers(response.data);
			})
			.catch((error) => {
				console.log(error);
			});
	};

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

		connection.on("ReceiveActiveUsers", (activeUsers) => {
			setUsers(activeUsers);
		});

		return connection; // Return the connection for cleanup
	};

	return (
		<>
			<Table className={classes.table}>
				<TableHead>
					<TableRow>
						<TableCell>No.</TableCell>
						<TableCell>Name</TableCell>
						<TableCell>Story Points</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{users.map((user, index) => (
						<TableRow key={index}>
							<TableCell>{index + 1}</TableCell>
							<TableCell>{user.name}</TableCell>
							<TableCell>{user.points}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>

			<Button
				type="submit"
				fullWidth
				variant="contained"
				sx={{ mt: 3, mb: 2 }}
			>
				test
			</Button>
		</>
	)
}

