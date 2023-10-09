import { Box, Button, FormControl, InputLabel, MenuItem, Select, Table, TableBody, TableCell, TableFooter, TableHead, TableRow } from "@mui/material"
import { makeStyles } from "@mui/styles";
import { useLocation, useNavigate } from "react-router-dom";
import * as signalR from "@microsoft/signalr";
import { useEffect, useState } from "react";
import axios from "axios";
import ConfirmDialog from "./ConfirmDialog";
import ReportIcon from '@mui/icons-material/Report';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

const useStyles = makeStyles(theme => ({
	table: {
		// Make the header and footer sticky
		'& thead, & tfoot': {
            position: 'sticky',
            zIndex: 1
        },
		'& thead': {
			top: 0, // Add this to stick the header to the top
			backgroundColor: 'rgba(255, 255, 255, 1)', // Make the background fully opaque
		},
		'& tfoot': {
			bottom: 0, // Add this to stick the footer to the bottom
			backgroundColor: 'rgba(255, 255, 255, 1)', // Make the background fully opaque
		},
		'& thead th': {
			fontWeight: '600',
			color: '#333996',
			backgroundColor: '#3c44b126',
		},
		'& tfoot td': {
			fontWeight: '500',
			fontSize: '1rem',
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

	const [records, setRecords] = useState([]);
	const [user, setUser] = useState({});
	const [toggleShow, setToggleShow] = useState(false);
	const [confirmDialog, setConfirmDialog] = useState({ 
		isOpen: false, title: '', subtitle: '', color: '', icon: null
	})

	useEffect(() => {
		// Initialize SignalR connection
		const signalRConnection = initializeSignalR();

		checkToggleShow();
		getUser(username);
		getRecords();

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

		connection.on("ReceiveActiveUsers", (activeUsers) => {
			setRecords(activeUsers);
		});

		connection.on('ReceiveToggleShow', (toggleShowState) => {
            setToggleShow(toggleShowState);
        });

		connection.on("ReceiveSessionRestarted", (activeUsers) => {
			setRecords(activeUsers);
			setUser(prevUser => ({
				...prevUser,
				hasVoted: false
			}))
		});

		connection.on("ReceiveSessionExists", (sessionExists) => {
			// Redirect users back to the home page if session has ended
			if (sessionExists === false)
				navigate('/');
		});

		return connection; // Return the connection for cleanup
	};

	const checkToggleShow = async () => {
		const endpoint = apiUrl + '/session/toggleShow';

		try {
			const response = await axios.get(endpoint);
			setToggleShow(response.data);
		} catch (error) {
			console.log(error);
		}
	}

	const getUser = (username) => {
		axios.get(`${apiUrl}/session/users/${username}`)
			.then((response) => {
				const user = response.data;
				if (user)
					setUser(user);
				else
					navigate('/');

			})
			.catch((error) => {
				console.log(error);
			});
	};

	const getRecords = () => {
		axios.get(`${apiUrl}/session/users`)
			.then((response) => {
				setRecords(response.data);
			})
			.catch((error) => {
				console.log(error);
			});
	};

	const updateUser = (user) => {
		axios.post(`${apiUrl}/session/users/${username}`, null, {
			params: {
				points: user.points
			}
		})
			.then((response) => {
				// User is updated
			})
			.catch((error) => {
				console.log(error);
			});
	};

	const updateToggleShow = (newToggleShow) => {
		axios.post(`${apiUrl}/session/toggleShow`, null, {
			params: {
				toggleShow: newToggleShow
			}
		})
			.then((response) => {
				// Toggle show is updated
			})
			.catch((error) => {
				console.log(error);
			});
	}

	const resetUserPoints = () => {
		axios.post(`${apiUrl}/session/users/reset`)
			.then((response) => {
				// Handle the successful response as needed
			})
			.catch((error) => {
				console.log(error);
			});
	}

	const endSession = () => {
		axios.delete(`${apiUrl}/session/users`)
			.then((response) => {
				// Handle the successful response as needed
			})
			.catch((error) => {
				console.log(error);
			});
	}

	const handleChange = (event) => {
		setUser({
			...user,
			points: event.target.value
		});
	};

	const handleVote = () => {
		updateUser(user);
		setUser({
			...user,
			hasVoted: true
		});
	}

	const toggleShowPoints = () => {
		const newToggleShow = !toggleShow;
        setToggleShow(newToggleShow);

		updateToggleShow(newToggleShow);
	}

	const handleRestart = () => {
		setConfirmDialog({
			title: 'Are you sure you want to restart this session?',
			subtitle: "All users' points will be reset.",
			isOpen: true,
			color: '#1976D2',
			icon: <RestartAltIcon />,
			onConfirm: () => resetUserPoints()
		})
	};

	const handleEndSession = () => {
		setConfirmDialog({
			title: 'Are you sure you want to end this session?',
			subtitle: "All users will be kicked.",
			isOpen: true,
			color: '#d32f2f',
			icon: <ReportIcon />,
			onConfirm: () => endSession()
		})
	};

	const calculateAveragePoints = (records) => {
		if (records.length === 0) {
		  return 0; // Default to 0 if there are no records
		}
	
		const totalPoints = records.reduce((acc, user) => acc + user.points, 0);
		const average =  totalPoints / records.length;

		// Round the average to two decimal places
		return parseFloat(average.toFixed(2));
	}

	return (
		<>
			<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, m: 2 }}>
				<FormControl sx={{ width: '150px' }}>
					<InputLabel>Story Points</InputLabel>
					<Select
						value={user.points}
						label="Story Points"
						onChange={handleChange}
					>
						<MenuItem value={0.5}>0.5</MenuItem>
						<MenuItem value={1}>1</MenuItem>
						<MenuItem value={2}>2</MenuItem>
						<MenuItem value={3}>3</MenuItem>
						<MenuItem value={5}>5</MenuItem>
						<MenuItem value={8}>8</MenuItem>
						<MenuItem value={13}>13</MenuItem>
						<MenuItem value={21}>21</MenuItem>
					</Select>
				</FormControl>

				<Button 
					variant="contained" 
					color="primary" 
					onClick={handleVote}
					disabled={user.hasVoted}
				>
					Vote
				</Button>
			</Box>

			<Box sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
				<Table className={classes.table}>
					<TableHead>
						<TableRow>
							<TableCell>No.</TableCell>
							<TableCell>Name</TableCell>
							<TableCell>Story Points</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{records.map((user, index) => (
							<TableRow key={index}>
								<TableCell>{index + 1}</TableCell>
								<TableCell>{user.name}</TableCell>
								{toggleShow && <TableCell>{user.points}</TableCell>}
							</TableRow>
						))}
					</TableBody>
					<TableFooter>
						<TableRow>
						<TableCell colSpan={2} className={classes.footerCell}>
							Average
						</TableCell>
						<TableCell>
							{/* Calculate and display the average points here */}
							{toggleShow && calculateAveragePoints(records)}
						</TableCell>
						</TableRow>
					</TableFooter>
				</Table>
			</Box>

			{user.isAdmin && (
				<>
					<Button
						type="submit"
						fullWidth
						variant="contained"
						sx={{ mt: 3, mb: 2 }}
						onClick={toggleShowPoints}
					>
						{toggleShow ? 'Hide Points' : 'Show Points'}
					</Button>
					<Button
						type="button"
						fullWidth
						variant="contained"
						sx={{ mt: 1, mb: 1 }}
						onClick={handleRestart}
					>
						Restart Session
					</Button>
					<Button
						type="button"
						fullWidth
						variant="contained"
						color="error"
						sx={{ mt: 1, mb: 2 }}
						onClick={handleEndSession}
					>
						End Session
					</Button>
				</>
			)}

			<ConfirmDialog 
				confirmDialog={confirmDialog}
				setConfirmDialog={setConfirmDialog}
			/>
		</>
	)
}