const PRIMARY_GREEN = '#4CAF50';
const ACCENT_ORANGE = '#FF7F00';

// 2. Collez la structure de style que vous avez mémorisée ici
export const addPlantStyles = {
    // 1. MODAL BOX
    modalBox: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: { xs: '90%', sm: 650 },
        maxHeight: '90vh',
        overflowY: 'auto',
        bgcolor: 'white',
        borderRadius: 2,
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
        p: 4,
        outline: 'none',
    },

    // 2. MODAL HEADER
    modalHeader: {
        display: 'flex',
        alignItems: 'center',
        mb: 3,
        pb: 2,
        borderBottom: '1px solid #e5e7eb', 
    },

    // 3. MODAL TITLE
    modalTitle: {
        fontWeight: 700,
        color: '#111827',
        flexGrow: 1,
        fontSize: { xs: '1.4rem', sm: '1.6rem' },
        ml: 1, 
    },

    // 4. CLOSE ICON
    closeIcon: {
        color: '#6b7280',
        cursor: 'pointer',
        transition: 'color 0.2s',
        '&:hover': {
            color: PRIMARY_GREEN, // Utilisez la constante définie ici
        },
    },

    // 5. SUBMIT BUTTON
    submitButton: {
        mt: 4, 
        py: 1.5,
        fontSize: '1.1rem',
        borderRadius: '8px', 
        bgcolor: ACCENT_ORANGE, // Utilisez la constante définie ici
        color: 'white',
        fontWeight: 700,
        textTransform: 'none',
        transition: 'all 0.3s ease',
        '&:hover': {
            bgcolor: '#E66300', 
            boxShadow: '0 10px 15px -3px rgba(249, 115, 22, 0.5)',
        },
        '&:disabled': {
            opacity: 0.7,
            cursor: 'not-allowed',
        }
    },

    // 6. FORM CONTROL
    formControl: {
        width: '100%',
        mb: 2,
        // Ces styles assurent que tous les champs ont la même apparence au focus
        '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            '&.Mui-focused fieldset': {
                borderColor: PRIMARY_GREEN,
                borderWidth: '2px',
            },
        },
        '& .MuiInputLabel-root.Mui-focused': {
            color: PRIMARY_GREEN,
        },
    },
    
    // IMAGE UPLOAD
    imageUploadContainer: {
        border: '2px dashed #ccc',
        borderRadius: '8px',
        p: 2,
        textAlign: 'center',
        mt: 1,
        transition: 'border-color 0.3s',
        '&:hover': {
            borderColor: PRIMARY_GREEN,
        },
    },

    // UPLOAD BUTTON
    uploadButton: {
        color: PRIMARY_GREEN,
        borderColor: PRIMARY_GREEN,
        fontWeight: 'bold',
        textTransform: 'none',
        borderRadius: '20px', 
        mt: 1,
        mb: 1,
        '&:hover': {
            backgroundColor: 'rgba(76, 175, 80, 0.04)',
            borderColor: PRIMARY_GREEN,
        },
    },
};

// Export de la constante de couleur pour les icônes
export { PRIMARY_GREEN };