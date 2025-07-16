module.exports = function checkIfUserAgentIsBrowser(/** @type {import('express').Request} */req) {
    return req.headers['user-agent'] && !req.headers['user-agent'].includes('UnityPlayer');
}