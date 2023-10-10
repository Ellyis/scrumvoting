import { Box, Button, FormControl, IconButton, InputLabel, MenuItem, Paper, Select, Table, TableBody, TableCell, TableFooter, TableHead, TableRow, Toolbar, Typography } from "@mui/material"
import { makeStyles } from "@mui/styles";
import { useLocation, useNavigate } from "react-router-dom";
import * as signalR from "@microsoft/signalr";
import { useEffect, useState } from "react";
import ConfirmDialog from "./ConfirmDialog";
import ReportIcon from '@mui/icons-material/Report';
import { EndSession, GetRecords, GetToggleShow, GetUser, ResetUserPoints, UpdateToggleShow, UpdateUser } from "../api";
import Notification from "./Notification";
import RefreshIcon from '@mui/icons-material/Refresh';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

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
		'& tr td': {
			fontSize: '1rem',
			padding: '12px 16px'
		},
		'& thead th': {
			fontWeight: '700',
			fontSize: '1rem',
			color: '#333996',
			backgroundColor: '#3c44b126',
		},
		'& tfoot td': {
			fontWeight: '500',
			fontSize: '1.2rem',
			color: '#333996',
			backgroundColor: '#3c44b126',
			padding: '18px'
		}
	},
	votedCell: {
		textAlign: 'center',
		width: '70%',
		color: 'white',
		padding: '0.5em 0',
		borderRadius: '2em',
		fontWeight: 'bolder',
		fontSize: '0.95rem'
	},
}))

export default function Voting() {
	const classes = useStyles();
	const navigate = useNavigate();

	const hubUrl = process.env.REACT_APP_HUB_URL;

	const location = useLocation();
	const searchParams = new URLSearchParams(location.search);
	const username = searchParams.get('username');

	const [records, setRecords] = useState([]);
	const [user, setUser] = useState({});
	const [toggleShow, setToggleShow] = useState(false);
	const [notify, setNotify] = useState({
		isOpen: false, type: '', message: ''
	})
	const [confirmDialog, setConfirmDialog] = useState({
		isOpen: false, title: '', subtitle: '', color: '', icon: null
	})

	useEffect(() => {
		// Initialize SignalR connection
		const signalRConnection = initializeSignalR();

		const fetchData = async () => {
			try {
				const [showResponse, recordsResponse, userResponse] = await Promise.all([
					GetToggleShow(),
					GetRecords(),
					GetUser(username)
				]);
				// Access the responses here
				setToggleShow(showResponse);
				setRecords(recordsResponse);
				if (userResponse) {
					setUser(userResponse);
				} else {
					navigate('/')
				}
			} catch (error) {
				console.log(error);
			}
		};
		fetchData();

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
			setNotify({
				isOpen: true,
				type: 'warning',
				message: 'The session has been reset'
			})
		});

		connection.on("ReceiveSessionExists", (sessionExists) => {
			// Redirect users back to the home page if session has ended
			if (sessionExists === false) {
				navigate('/');
			}
		});

		return connection; // Return the connection for cleanup
	};

	const handleChange = (event) => {
		setUser(prev =>({
			...prev,
			points: event.target.value
		}));
	};

	const handleVote = () => {
		setUser(prev => ({
			...prev,
			hasVoted: true
		}));

		if (UpdateUser(user)) {
			setNotify({
				isOpen: true,
				type: 'success',
				message: 'Your vote has been recorded'
			})
		}
	}

	const toggleShowPoints = () => {
		const newToggleShow = !toggleShow;
		setToggleShow(newToggleShow);

		UpdateToggleShow(newToggleShow);
	}

	const handleReset = () => {
		setConfirmDialog({
			title: 'Are you sure you want to restart this session?',
			subtitle: "All users' points will be reset.",
			isOpen: true,
			color: '#1976D2',
			icon: <RefreshIcon />,
			onConfirm: () => ResetUserPoints()
		})
	};

	const handleEndSession = () => {
		setConfirmDialog({
			title: 'Are you sure you want to end this session?',
			subtitle: "All users will be kicked.",
			isOpen: true,
			color: '#d32f2f',
			icon: <ReportIcon />,
			onConfirm: () => EndSession()
		})
	};

	const calculateAveragePoints = (records) => {
		if (records.length === 0) {
			return 0; // Default to 0 if there are no records
		}

		const totalPoints = records.reduce((acc, user) => acc + user.points, 0);
		const average = totalPoints / records.length;

		// Round the average to two decimal places
		return parseFloat(average.toFixed(2));
	}

	return (
		<>
			<Box sx={{ display: 'flex', justifyContent: 'center', m: 2 }}>
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
			</Box>

			<Box sx={{display: 'flex', justifyContent: 'center'}}>
				<Paper elevation={3} sx={{ width: '80%' }}>
					<Toolbar sx={{ justifyContent: 'space-between' }}>
						<Typography variant="h6" component="div">Voting List</Typography>
						{user.isAdmin && (
							<Box style={{ display: 'flex', gap: '1rem' }}>
								<Button
									variant="outlined"
									startIcon={<RefreshIcon />}
									onClick={handleReset}
								>
									Reset Session
								</Button>
								<Button 
									variant="contained"
									color="success"
									startIcon={<AddCircleOutlineIcon />}
									onClick={handleVote}
									disabled={user.hasVoted}
								>
									Cast Vote
								</Button>
							</Box>
						)}
						
					</Toolbar>

					<Box sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
						<Table className={classes.table}>
							<TableHead>
								<TableRow>
									<TableCell>No.</TableCell>
									<TableCell>Name</TableCell>
									<TableCell align="center">Status</TableCell>
									<TableCell width="30%">
										Story Points &nbsp;
										{user.isAdmin && (
											<IconButton style={{ padding: '0', color: '#333996' }} onClick={toggleShowPoints}>
											{toggleShow ? <VisibilityIcon /> : <VisibilityOffIcon />}
										</IconButton>
										)}
									</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{records.map((user, index) => (
									<TableRow key={index}>
										<TableCell>{index + 1}</TableCell>
										<TableCell>{user.name}</TableCell>
										<TableCell style={{ display: 'flex', justifyContent: 'center' }}>
											<div className={classes.votedCell} style={{ backgroundColor: user.hasVoted ? 'green' : 'orange' }}>
												{user.hasVoted ? 'Voted' : 'Not Voted'}
											</div>
										</TableCell>
										<TableCell>{toggleShow ? user.points : '*'}</TableCell>
									</TableRow>
								))}
							</TableBody>
							<TableFooter>
								<TableRow>
									<TableCell colSpan={3} className={classes.footerCell}>
										Average
									</TableCell>
									<TableCell>
										{/* Calculate and display the average points here */}
										{toggleShow ? calculateAveragePoints(records) : '*'}
									</TableCell>
								</TableRow>
							</TableFooter>
						</Table>
					</Box>
				</Paper>
			</Box>

			{user.isAdmin && (
				<Box sx={{display: 'flex', justifyContent: 'center'}}>
					<Box style={{ width: '80%', display: 'flex', justifyContent: 'flex-end', gap: '1rem', margin: '1rem' }}>
						<Button 
							variant="outlined"
							color="error"
							startIcon={<ExitToAppIcon />}
							onClick={handleEndSession}
						>
							End Session
						</Button>
						<Button
							variant="outlined"
							startIcon={<RefreshIcon />}
							onClick={handleReset}
						>
							Reset Session
						</Button>
					</Box>
				</Box>
			)}

			<Notification 
				notify={notify}
				setNotify={setNotify}
			/>

			<ConfirmDialog
				confirmDialog={confirmDialog}
				setConfirmDialog={setConfirmDialog}
			/>
		</>
	)
}