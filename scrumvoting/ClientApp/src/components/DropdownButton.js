import { Button, Menu, MenuItem } from "@mui/material";
import { useState } from "react";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles(theme => ({
	menuItem: {
		'& li': {
            minWidth: '130px'
        }
	},
}))

const options = [0.5, 1, 2, 3, 5, 8, 13, 21];

export default function DropdownButton({ setConfirmDialog, castVote, ...other }) {
    const classes = useStyles();
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleChange = (option) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Are you sure you want to cast your vote?',
            subtitle: 'You can only vote once per round.',
            icon: option,
            buttonColor: 'success',
            onConfirm: () => castVote(option)
        })
        setAnchorEl(null);
    }

    return (
        <div>
            <Button
                id="demo-customized-button"
                aria-controls={open ? 'demo-customized-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                variant="contained"
                disableElevation
                onClick={handleClick}
                color="success"
                startIcon={<AddCircleOutlineIcon />}
                {...other}
            >
                Cast Vote
            </Button>
            <Menu
                className={classes.menuItem}
                id="demo-customized-menu"
                MenuListProps={{
                    'aria-labelledby': 'demo-customized-button',
                }}
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
            >
                {options.map((option, index) => (
                    <MenuItem key={index} onClick={() => handleChange(option)} disableRipple>
                        {option}
                    </MenuItem>
                ))}
            </Menu>
        </div>
    );
}