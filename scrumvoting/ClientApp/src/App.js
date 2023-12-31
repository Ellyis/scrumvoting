import React, { Component, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import './custom.css';
import { ThemeProvider } from '@mui/styles';
import { createTheme } from '@mui/material';
import { useEffect } from "react";
import * as signalR from "@microsoft/signalr";
import Home from './components/Home';
import Voting from './components/Voting';
import ConfirmDialog from './components/ConfirmDialog';
import Notification from './components/Notification';

export default class App extends Component {
	static displayName = App.name;
	
	render() {
		return (
			<AppPage />
		);
	}
}


function AppPage() {
	const theme = createTheme();
	const navigate = useNavigate();
	const hubUrl = process.env.REACT_APP_HUB_URL;
	
	const [isReady, setIsReady] = useState(false);
	const [signalRConnection, setSignalRConnection] = useState(null);
	const [notify, setNotify] = useState({
		isOpen: false, type: '', message: ''
	})
	const [confirmDialog, setConfirmDialog] = useState({
		isOpen: false, title: '', subtitle: '', icon: null, iconColor: '', buttonColor: ''
	})
	
	useEffect(() => {
		const initializeConnection = async () => {
			const connection = await initializeSignalR(hubUrl);
			setSignalRConnection(connection);
			setIsReady(true);
		};
		
		initializeConnection();
		
		
		const storedUsername = localStorage.getItem('username');
		if (storedUsername) {
			navigate(`/voting?username=${storedUsername}`);
		}
		
		return () => {
            if (signalRConnection) {
				signalRConnection.stop();
			}
        };
	}, [hubUrl]);
	
	const initializeSignalR = async (hubUrl) => {
		const connection = new signalR.HubConnectionBuilder()
			.withUrl(hubUrl)
			.withAutomaticReconnect()
			.build();
		
		try {
			await connection.start();
			
			return connection;
		} catch (error) {
			console.error("SignalR connection error: " + error);
			return null;
		}
	}
	
	return (
		<>
			<ThemeProvider theme={theme}>
				<Layout>
					{isReady && (
						<Routes>
							<Route 
								path='/' 
								element={<Home signalRConnection={signalRConnection} setConfirmDialog={setConfirmDialog} />} 
							/>
							<Route 
								path='/voting'
								element={<Voting signalRConnection={signalRConnection} setNotify={setNotify} setConfirmDialog={setConfirmDialog} />} 
							/>
						</Routes>
					)}
					
					<Notification
						notify={notify}
						setNotify={setNotify}
					/>
					
					<ConfirmDialog
						confirmDialog={confirmDialog}
						setConfirmDialog={setConfirmDialog}
					/>
				</Layout>
			</ThemeProvider>
		</>
	)
}