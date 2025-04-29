import express from 'express';
const app = express();
import configRoutes from './routes/index.js';
import exphbs from 'express-handlebars';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import csurf from 'csurf';
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"]
    }
  }
}));

app.use((req, res, next) => {
  const ua = req.get('User-Agent') || '';
  if (ua.length > 256) return res.status(400).send("Bad User-Agent");
  next();
});

app.use('/public', express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.engine('handlebars', exphbs.engine({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

app.use(cookieParser());

app.use(
  session({
    name: 'AuthenticationState',
    secret: "This is a secret.. shhh don't tell anyone",
    saveUninitialized: false,
    resave: false,
    cookie: {
      httpOnly: true,
      sameSite: 'strict'
    }
  })
);

// Makes CSRF token available in all templates as {{csrfToken}}
app.use(csurf({ cookie: true }));
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.disable('x-powered-by');


/* This middleware will apply to the root route / 
Keeping this here for future error checking
*/
app.use('/', async (req, res, next) => {
  let authenticated;
  if (req.session.user) {
    authenticated = true;
  } else {
    authenticated = false;
  }
  console.log(
    '[ ' + new Date().toUTCString() + ']: ' +  // [Sun, 14 Apr 2019 23:56:06 GMT]:
    req.method + ' ' +  // GET
    req.originalUrl + " " + // /login
    authenticated
  );
  /*
  if the user is authenticated 
  AND they have a household, 
  the middleware function will 
  redirect them to the /household/info route, 
  if the user is authenticated 
  AND they do not have a household, 
  you will redirect them to the /household/new route. 
  If the user is NOT authenticated, 
  you will redirect them to the GET /login route. 
  */
  if (req.path === '/') {
    const authenticated = req.session.user;
    if (authenticated) {
      if (authenticated.householdName.length === 0) {
        return res.redirect('/household/new');
      }
      else if (authenticated.householdName.length !== 0) {
        return res.redirect('/household/info');
      }
    } else {
      next();
    }
  } else {
    next();
  }
});
app.use('/users', async (req, res, next) => {
  const authenticated = req.session.user;
  if (req.path === '/') {
    if (!authenticated) {
      return res.redirect('/users/login');
    } else if (authenticated && authenticated.householdName.length !== 0) {
      return res.redirect('/household/info');
    } else if (authenticated && authenticated.householdName.length === 0) {
      return res.redirect('/household/new');
    } else {
      next();
    }
  } else {
    next();
  }
});
/*
This middleware will only be used for the 
GET /login route and will do one of the following: 
If the user is authenticated AND they have a householdName, 
the middleware function will redirect them to the /household/info route, 
if the user is authenticated AND they do not have a householdName, 
you will redirect them to the /household/new route. 
If the user is NOT authenticated, 
you will allow them to get through to the GET /login route. 
A logged in user should never be able to access the login form.
*/
app.use('/users/login', (req, res, next) => {
  const authenticated = req.session.user;
  if (authenticated) {
    if (authenticated.householdName.length === 0) {
      return res.redirect('/household/new');
    }
    else if (authenticated.householdName.length !== 0) {
      return res.redirect('/household/info');
    }
  } else {
    next();
  }
});

/*
This middleware will only be used for the 
GET /signup route and will do one of the following: 
If the user is authenticated AND they have a householdName, 
the middleware function will redirect them to the /household/info route,
if the user is authenticated AND they DO NOT have a householdName, 
you will redirect them to the /household/new route. 
If the user is NOT authenticated, 
you will allow them to get through to the GET /signup route. 
A logged in user should never be able to access the registration form.
*/
app.use('/users/signup', async (req, res, next) => {
  const authenticated = req.session.user;
  if (authenticated) {
    if (authenticated.householdName.length === 0) {
      return res.redirect('/household/new');
    }
    else if (authenticated.householdName.length !== 0) {
      return res.redirect('/household/info');
    }
  } else {
    next();
  }
});
/*
This middleware will only be used for the 
GET /profile route and will do one of the following: 
If the user is NOT authenticated, 
you will allow them to get through to the GET /login route. 
*/
app.use('/users/profile', async (req, res, next) => {
  const authenticated = req.session.user;
  if (!authenticated) {
    if (authenticated.householdName.length === 0) {
      return res.redirect('/household/login');
    }
  } else {
    next();
  }
});
/*
This middleware will only be used for the 
GET /household route and will do one of the following: 
If the user is authenticated AND they have a householdName, 
the middleware function will redirect them to the /household/info route,
if the user is authenticated AND they DO NOT have a householdName, 
you will redirect them to the /household/new route. 
If the user is NOT authenticated, 
you will allow them to get through to the GET /signup route. 
*/
app.use('/household', async (req, res, next) => {
  const authenticated = req.session.user;
  if (req.path === '/') {
    if (!authenticated) {
      return res.redirect('/users/login');
    } else if (authenticated && authenticated.householdName.length !== 0) {
      return res.redirect('/household/info');
    } else if (authenticated && authenticated.householdName.length === 0) {
      return res.redirect('/household/new');
    } else {
      next();
    }
  } else {
    next();
  }
});
/*
This middleware will only be used for the 
GET /household/new route and will do one of the following:
If a user is not logged in, you will redirect to the 
GET / route.
If the user is logged in, AND has a householdName,
you will redirect them to /household/info route.
If the user is logged in, AND does NOT have a householdName
the middleware will "fall through" to the next route calling the next() callback.
*/
app.use('/household/new', async (req, res, next) => {
  const authenticated = req.session.user;
  if (!authenticated) {
    return res.redirect('/users/login');
  } else if (authenticated && authenticated.householdName.length !== 0) {
    return res.redirect('/household/info');
  } else {
    next();
  }
});
/*
This middleware will only be used for the 
GET /household/info route and will do one of the following:
If a user is not logged in, you will redirect to the 
GET / route.
If a user is logged in, but does NOT have a householdName, 
you will redirect to /householdName/new
If the user is logged in AND the user has a householdName, 
the middleware will "fall through" to the next route calling the next() callback.
ONLY USERS SHOULD BE ABLE TO ACCESS THE /household ROUTE!
*/
app.use('/household/info', async (req, res, next) => {
  const authenticated = req.session.user;
  if (!authenticated) {
    return res.redirect('/users/login');
  } else if (authenticated && authenticated.householdName.length === 0) {
    return res.redirect('/household/new');
  } else {
    next();
  }
});
/*
This middleware will only be used for the 
GET /household/create route and will do one of the following:
If a user is not logged in, you will redirect to the 
GET / route.
If the user is logged in, AND has a householdName,
you will redirect them to /household/info route.
If the user is logged in, AND does NOT have a householdName
the middleware will "fall through" to the next route calling the next() callback.
*/
app.use('/household/create', async (req, res, next) => {
  const authenticated = req.session.user;
  if (!authenticated) {
    return res.redirect('/users/login');
  } else if (authenticated && authenticated.householdName.length !== 0) {
    return res.redirect('/household/info');
  } else {
    next();
  }
});
/*
This middleware will only be used for the 
GET /household/join route and will do one of the following:
If a user is not logged in, you will redirect to the 
GET / route.
If the user is logged in, AND has a householdName,
you will redirect them to /household/info route.
If the user is logged in, AND does NOT have a householdName
the middleware will "fall through" to the next route calling the next() callback.
*/
app.use('/household/join', async (req, res, next) => {
  const authenticated = req.session.user;
  if (!authenticated) {
    return res.redirect('/users/login');
  } else if (authenticated && authenticated.householdName.length !== 0) {
    return res.redirect('/household/info');
  } else {
    next();
  }
});
/*
This middleware will only be used for the 
GET /logout route and will do one of the following:
1. If a user is not logged in,
you will redirect to the GET / route.
2. if the user is logged in, 
the middleware will "fall through" to the next route calling the next() callback.
*/
app.use('/logout', async (req, res, next) => {
  const authenticated = req.session.user;
  if (!authenticated) {
    return res.redirect('/users/login');
  } else {
    next();
  }
});
/** Only checks if user is authenticated for access and has householdName */
app.use('/announcements', async (req, res, next) => {
  const authenticated = req.session.user;
  if (!authenticated) {
    return res.redirect('/users/login');
  }
  else if (authenticated && authenticated.householdName.length === 0) {
    return res.redirect('/household/new');
  } else {
    next();
  }
});

/** Only checks if user is authenticated for access and has householdName */
app.use('/items', async (req, res, next) => {
  const authenticated = req.session.user;
  if (!authenticated) {
    return res.redirect('/users/login');
  }
  else if (authenticated && authenticated.householdName.length === 0) {
    return res.redirect('/household/new');
  } else {
    next();
  }
});

app.use('/groceryLists', async (req, res, next) => {
  const authenticated = req.session.user;
  if (req.path === '/') {
    if (!authenticated) {
      return res.redirect('/users/login');
    } else if (authenticated && authenticated.householdName.length !== 0) {
      return res.redirect('/household/info');
    } else if (authenticated && authenticated.householdName.length === 0) {
      return res.redirect('/household/new');
    } else {
      next();
    }
  } else {
    next();
  }
});

app.use('/groceryLists/:id', async (req, res, next) => {
  const authenticated = req.session.user;
  if (!authenticated) {
    return res.redirect('/users/login');
  } else if (authenticated && authenticated.householdName.length === 0) {
    return res.redirect('/household/new');
  } else {
    next();
  }
});


app.use('/groceryLists/edit', async (req, res, next) => {
  const authenticated = req.session.user;
  if (!authenticated) {
    return res.redirect('/users/login');
  }
  else if (authenticated && authenticated.householdName.length === 0) {
    return res.redirect('/household/new');
  } else {
    next();
  }
});

app.use('/groceryLists/delete', async (req, res, next) => {
  const authenticated = req.session.user;
  if (!authenticated) {
    return res.redirect('/users/login');
  }
  else if (authenticated && authenticated.householdName.length === 0) {
    return res.redirect('/household/new');
  } else {
    next();
  }
});

configRoutes(app);

app.listen(3000, () => {
  console.log("We've now got a server!");
  console.log('Your routes will be running on http://localhost:3000');
});