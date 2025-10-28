const PRIMARY_GREEN = '#4CAF50'; // Vert d'accentuation (pour les actions positives)
const ACCENT_ORANGE = '#FF7F00';
// Nouveau : Couleur principale pour le texte et les éléments sombres
const PRIMARY_ACTION_COLOR = '#1A1A1A'; // Gris très foncé/noir pour le contraste

export const addPlantStyles = {
    // 1. MODAL BOX (Amélioration de l'ombre)
    modalBox: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: { xs: '90%', sm: 650 },
        maxHeight: '90vh',
        overflowY: 'auto',
        bgcolor: 'white',
        borderRadius: 3, // Légèrement plus arrondi
        boxShadow: '0 8px 16px rgba(17, 24, 39, 0.1), 0 4px 8px rgba(17, 24, 39, 0.05)', // Ombre plus douce
        p: 5, // Un peu plus de padding
        outline: 'none',
    },

    // 2. MODAL HEADER (Reste épuré)
    modalHeader: {
        display: 'flex',
        alignItems: 'center',
        mb: 4, // Plus d'espace sous l'en-tête
        pb: 2,
        borderBottom: '1px solid #e5e7eb',
    },

    // 3. MODAL TITLE (Utilisation de la couleur d'action pour le titre)
    modalTitle: {
        fontWeight: 700,
        color: PRIMARY_ACTION_COLOR, // Titre bien sombre
        flexGrow: 1,
        fontSize: { xs: '1.5rem', sm: '1.8rem' }, // Plus grand
        ml: 1,
    },

    // 4. CLOSE ICON (Maintient le vert au hover)
    closeIcon: {
        color: '#6b7280',
        cursor: 'pointer',
        transition: 'color 0.2s',
        '&:hover': {
            color: PRIMARY_GREEN,
        },
    },

    // 5. TITRE DE SECTION (Maintient le vert au hover)
    sectionTitle: {
        fontWeight: 600,
        color: PRIMARY_ACTION_COLOR,
        fontSize: '1.3rem', // Plus mis en évidence
        mb: 2,
        mt: 4, // Plus d'espace au-dessus
        borderBottom: '1px solid #e5e7eb',
        pb: 0.5,
    },

    // 6. CONTENEUR PRINCIPAL D'INFORMATIONS (Espace augmenté)
    generalInfoContainer: {
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: 'center',
        gap: 4, // Plus d'espace entre l'image et les inputs
        mb: 4,
        mt: 3,
    },

    // 7. CONTENEUR D'ENTRÉES TEXTE (Reste structurel)
    textInputStack: {
        flexGrow: 1,
        width: { xs: '100%', sm: 'auto' },
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
    },

    // 8. ACTION BUTTONS CONTAINER (Légèrement plus de padding pour l'esthétique)
    actionButtonsContainer: {
        mt: 4,
        pt: 3,
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 2,
    },

    // 9. SUBMIT BUTTON (Style plus plat et moderne)
    submitButton: {
        py: 1.5,
        px: 4,
        fontSize: '1.0rem',
        borderRadius: '10px', // Très arrondi
        bgcolor: PRIMARY_GREEN,
        color: 'white',
        fontWeight: 600,
        textTransform: 'none',
        transition: 'all 0.3s ease',
        '&:hover': {
            bgcolor: '#388E3C', // Vert foncé
            boxShadow: '0 4px 8px rgba(76, 175, 80, 0.4)', // Ombre subtile au hover
        },
        '&:disabled': {
            opacity: 0.6,
            cursor: 'not-allowed',
        }
    },

    // 10. FORM CONTROL (Amélioration du focus et du rayon)
    formControl: {
        width: '100%',
        '& .MuiOutlinedInput-root': {
            borderRadius: '10px', // Très arrondi
            '&.Mui-focused fieldset': {
                borderColor: PRIMARY_GREEN,
                borderWidth: '2px',
            },
            '&:hover fieldset': {
                borderColor: PRIMARY_GREEN, // Indication subtile au hover
            }
        },
        '& .MuiInputLabel-root.Mui-focused': {
            color: PRIMARY_GREEN,
        },
    },

    // 11. IMAGE UPLOAD CONTAINER
    imageUploadContainer: {
        p: 2,
        textAlign: 'center',
        flexShrink: 0,
        width: 'auto',
    },

    // 12. UPLOAD BUTTON (Plus de contraste et d'arrondi)
    uploadButton: {
        color: PRIMARY_GREEN,
        borderColor: PRIMARY_GREEN,
        fontWeight: 'bold',
        textTransform: 'none',
        borderRadius: '10px', // Très arrondi
        mt: 1,
        mb: 1,
        '&:hover': {
            backgroundColor: 'rgba(76, 175, 80, 0.08)', // Augmentation de la transparence au hover
            borderColor: PRIMARY_GREEN,
        },
    },

    // 13. IMAGE PREVIEW (Style avatar)
    imagePreviewStyle: {
        width: '120px', // Plus grande
        height: '120px', // Plus grande
        borderRadius: '50%',
        objectFit: 'cover',
        border: `3px solid ${PRIMARY_GREEN}`, // Bordure plus épaisse
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)', // Ombre plus marquée
    }
};

export { PRIMARY_GREEN, ACCENT_ORANGE, PRIMARY_ACTION_COLOR };