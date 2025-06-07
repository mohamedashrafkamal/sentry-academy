import { faker } from '@faker-js/faker';

export interface FakeUser {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar: string;
  company: string;
  jobTitle: string;
  phone: string;
  workEmail: string;
  provider: string;
  timestamp: string;
}

/**
 * Simulates fetching user credentials from SSO provider (Google, GitHub, etc.)
 * In a real app, this would be the OAuth callback response with user info
 * @param provider - The SSO provider (google, github, etc.)
 * @returns User credentials from the SSO provider
 */
export function fetchSSOUserCredentials(provider: string): FakeUser {
  console.log(`🔐 Fetching user credentials from ${provider.toUpperCase()} OAuth...`);
  
  // Simulate OAuth provider response delay
  // In real apps, this would be an async API call to the provider
  
  // Use a seed based on timestamp for some consistency in a session
  faker.seed(Date.now());
  
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const fullName = `${firstName} ${lastName}`;
  const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
  const email = faker.internet.email({ firstName, lastName });
  const company = faker.company.name();
  
  // Simulate provider-specific user data structure
  const userCredentials = {
    id: faker.string.uuid(), // OAuth sub claim
    email: email,
    name: fullName,
    firstName: firstName,
    lastName: lastName,
    username: username,
    avatar: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random&size=150`,
    company: company,
    jobTitle: faker.person.jobTitle(),
    phone: faker.phone.number(),
    workEmail: faker.internet.email({ firstName, lastName, provider: company.toLowerCase().replace(/\s+/g, '') + '.com' }),
    provider: provider,
    timestamp: new Date().toISOString()
  };
  
  console.log(`✅ Successfully retrieved user credentials from ${provider.toUpperCase()}:`, {
    name: userCredentials.name,
    email: userCredentials.email,
    provider: provider
  });
  
  return userCredentials;
}

/**
 * Creates an authentication token from SSO user credentials
 * Simulates generating a JWT token that would be sent to our backend
 * @param userCredentials - User credentials from SSO provider
 * @param provider - The SSO provider
 * @returns Base64 encoded authentication token
 */
export function createAuthenticationToken(userCredentials: FakeUser, provider: string): string {
  console.log(`🔑 Creating authentication token for ${userCredentials.name}...`);
  
  // Create JWT-like payload (in real apps, this would be properly signed)
  const tokenPayload = {
    sub: userCredentials.id,        // Subject (user ID from provider)
    email: userCredentials.email,
    name: userCredentials.name,
    provider: provider,
    iat: Math.floor(Date.now() / 1000),    // Issued at
    exp: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
    userData: userCredentials       // Full user profile from provider
  };
  
  const authToken = btoa(JSON.stringify(tokenPayload));
  console.log(`✅ Authentication token created successfully`);
  
  return authToken;
} 