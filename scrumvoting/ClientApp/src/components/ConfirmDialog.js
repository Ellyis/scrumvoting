import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles(theme => ({
    dialog: {
        padding: theme.spacing(2),
        position: 'absolute',
    },
    dialogTitle: {
        textAlign: 'center',
    },
    dialogContent: {
        textAlign: 'center',
    },
    dialogAction: {
        justifyContent: 'center !important',
        gap: theme.spacing(2)
    },
    titleIcon: {
        fontSize: '6rem',
        '& .MuiSvgIcon-root': {
            fontSize: '8rem'
        },
        '&:hover': {
            cursor: 'default'
        }
    }
}))

export default function ConfirmDialog({ confirmDialog, setConfirmDialog }) {
    const classes = useStyles();

    return (
        <Dialog open={confirmDialog.isOpen} classes={{ paper: classes.dialog }}>
            <DialogTitle className={classes.dialogTitle}>
                <Box className={classes.titleIcon} style={{ color: confirmDialog.iconColor }}>
                    {confirmDialog.icon}
                </Box>
            </DialogTitle>
            <DialogContent className={classes.dialogContent}>
                <Typography variant="h6">
                    {confirmDialog.title}
                </Typography>
                <Typography variant="subtitle2">
                    {confirmDialog.subtitle}
                </Typography>
            </DialogContent>
            <DialogActions className={classes.dialogAction}>
                <Button
                    variant="outlined"
                    color={confirmDialog.buttonColor}
                    onClick={() => setConfirmDialog(prev => ({
                        ...prev,
                        isOpen: false
                    }))} 
                >
                    No
                </Button>
                <Button
                    variant="contained"
                    color={confirmDialog.buttonColor}
                    onClick={() => {
                        confirmDialog.onConfirm(); 
                        setConfirmDialog(prev => ({
                            ...prev,
                            isOpen: false
                        }))
                    }}
                >
                    Yes
                </Button>
            </DialogActions>
        </Dialog>
    )
}
