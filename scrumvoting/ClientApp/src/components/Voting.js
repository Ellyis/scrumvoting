import { Box, Button, Paper, Table, TableBody, TableCell, TableFooter, TableHead, TableRow, Toolbar, Typography } from "@mui/material"
import { makeStyles } from "@mui/styles";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import ConfirmDialog from "./ConfirmDialog";
import ReportIcon from '@mui/icons-material/Report';
import { EndSession, GetRecords, GetIsSessionRevealed, GetUser, LeaveSession, ResetUserPoints, UpdateUserPoints, RevealSession } from "../api";
import Notification from "./Notification";
import RefreshIcon from '@mui/icons-material/Refresh';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DropdownButton from "./DropdownButton";

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
		width: '65%',
		color: 'white',
		padding: '0.5em 0',
		borderRadius: '2em',
		fontWeight: 'bolder',
		fontSize: '0.95rem'
	},
}))

export default function Voting({ signalRConnection }) {
	const classes = useStyles();
	const navigate = useNavigate();

	const location = useLocation();
	const searchParams = new URLSearchParams(location.search);
	const username = searchParams.get('username');
	const connectionId = signalRConnection.connection.connectionId;

	const [records, setRecords] = useState([]);
	const [user, setUser] = useState({});
	const [isSessionRevealed, setIsSessionRevealed] = useState(false);
	const [notify, setNotify] = useState({
		isOpen: false, type: '', message: ''
	})
	const [confirmDialog, setConfirmDialog] = useState({
		isOpen: false, title: '', subtitle: '', icon: null, iconColor: '', buttonColor: ''
	})

	useEffect(() => {
		if (user.isAdmin) {
			signalRConnection.invoke("SetAdminConnected", connectionId);
		}
	}, [user])

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [isRevealed, records, user] = await Promise.all([
					GetIsSessionRevealed(),
					GetRecords(),
					GetUser(username)
				]);
				setIsSessionRevealed(isRevealed);
				setRecords(records);
				if (user) {
					setUser(user);
				} else {
					navigate('/')
				}
			} catch (error) {
				console.log(error);
			}
		};
		fetchData();		

		signalRConnection.on("ReceiveActiveUsers", (activeUsers) => {
			setRecords(activeUsers);
		});

		signalRConnection.on("ReceiveNewUser", (name) => {
			if (name !== username) {
				setNotify({
					isOpen: true,
					type: 'success',
					message: `${name} has joined the session`
				})
			}
		});

		signalRConnection.on("ReceiveLeftUser", (name) => {
			if (name !== username) {
				setNotify({
					isOpen: true,
					type: 'error',
					message: `${name} has left the session`
				})
			}
		});

		signalRConnection.on('ReceiveIsRevealed', (isRevealed) => {
			console.log(isRevealed);
			setIsSessionRevealed(isRevealed);
		});

		signalRConnection.on("ReceiveVotesReset", (activeUsers) => {
			setRecords(activeUsers);
			setIsSessionRevealed(false);
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

		signalRConnection.on("ReceiveSessionExists", (sessionExists) => {
			// Redirect users back to the home page if session has ended
			if (sessionExists === false) {
				navigate('/');
				localStorage.removeItem('username');
			}
		});
	}, []);

	const castVote = (newPoints) => {
		const updatedUser = {
			...user,
			points: newPoints,
			hasVoted: true
		}
		setUser(updatedUser);
		if (UpdateUserPoints(updatedUser)) {
			setNotify({
				isOpen: true,
				type: 'success',
				message: 'Your vote has been recorded'
			})
		}
	}

	const revealSession = () => {
		setIsSessionRevealed(true);
		RevealSession();
	}

	const handleReset = () => {
		setConfirmDialog({
			title: 'Are you sure you want to reset all votes?',
			subtitle: "This action cannot be undone.",
			isOpen: true,
			icon: <RefreshIcon />,
			iconColor: '#1976D2',
			buttonColor: 'primary',
			onConfirm: () => ResetUserPoints()
		})
	};

	const handleEndSession = () => {
		setConfirmDialog({
			title: 'Are you sure you want to end this session?',
			subtitle: "All users will be kicked.",
			isOpen: true,
			icon: <ReportIcon />,
			iconColor: '#d32f2f',
			buttonColor: 'error',
			onConfirm: () => endSession()
		})
	};

	const handleLeaveSession = () => {
		setConfirmDialog({
			title: 'Are you sure you want to leave this session?',
			subtitle: "Your data will not be saved.",
			isOpen: true,
			icon: <ReportIcon />,
			iconColor: '#d32f2f',
			buttonColor: 'error',
			onConfirm: () => leaveSession(username)
		})
	};

	const endSession = () => {
		EndSession();
		localStorage.removeItem('username', username);
	}

	const leaveSession = async (username) => {
		await LeaveSession(username);

		localStorage.removeItem('username', username);
		navigate('/');
	}

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
			<Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
				<Paper elevation={3} sx={{ width: '80%' }}>
					<Toolbar sx={{ justifyContent: 'space-between' }}>
						<Typography variant="h6" component="div">Voting List</Typography>
						{/* <Button 
							variant="contained"
							color="success"
							startIcon={<AddCircleOutlineIcon />}
							onClick={handleVote}
							disabled={user.hasVoted}
						>
							Cast Vote
						</Button> */}
						<DropdownButton setConfirmDialog={setConfirmDialog} castVote={castVote} disabled={isSessionRevealed} />
					</Toolbar>

					<Box sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
						<Table className={classes.table}>
							<TableHead>
								<TableRow>
									<TableCell>No.</TableCell>
									<TableCell width="20%">Name</TableCell>
									<TableCell align="center">Status</TableCell>
									<TableCell width="30%">Story Points</TableCell>
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
										<TableCell>{isSessionRevealed ? user.points : '*'}</TableCell>
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
										{isSessionRevealed ? calculateAveragePoints(records) : '*'}
									</TableCell>
								</TableRow>
							</TableFooter>
						</Table>
					</Box>
				</Paper>
			</Box>

			<Box sx={{ display: 'flex', justifyContent: 'center' }}>
				<Box style={{ width: '80%', display: 'flex', justifyContent: 'flex-end', gap: '1rem', margin: '1rem' }}>
					{user.isAdmin ? (
						<>
							<Button 
								variant="outlined"
								color="error"
								startIcon={<ExitToAppIcon />}
								onClick={handleEndSession}
							>
								End Session
							</Button>
							{isSessionRevealed ? (
								<Button
									variant="outlined"
									startIcon={<RefreshIcon />}
									onClick={handleReset}
								>
									Reset Votes
								</Button>
							) : (
								<Button
									variant="outlined"
									startIcon={<VisibilityIcon />}
									onClick={revealSession}
								>
									Reveal Points
								</Button>
							)}
							
						</>
					) : (
						<Button 
							variant="outlined"
							color="error"
							startIcon={<ExitToAppIcon />}
							onClick={handleLeaveSession}
						>
							Leave Session
						</Button>
					)}
					
				</Box>
			</Box>

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