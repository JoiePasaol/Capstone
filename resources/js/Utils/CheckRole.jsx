export const checkRole = (user, allowedRoles) => {
    return user && allowedRoles.includes(user.role);
};
