import Stack from '@mui/material/Stack';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import React from 'react';

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function Notification({ notify, setNotify }) {    
    const handleClose = (event, reason) => {
        if (reason === 'clickaway') return;
        setNotify(prev => ({
            ...prev,
            isOpen: false
        }));
    };
    
    return (
        <Stack spacing={2} sx={{ width: '100%' }}>
            <Snackbar 
                open={notify.isOpen} 
                autoHideDuration={6000} 
                onClose={handleClose} 
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right'
                }}
            >
                <Alert onClose={handleClose} severity={notify.type} sx={{ width: '100%' }}>
                    {notify.message}
                </Alert>
            </Snackbar>
        </Stack>
    );
}