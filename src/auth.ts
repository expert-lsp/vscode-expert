import { AuthenticationSession, authentication, window } from "vscode";
import * as Logger from "./logger";

const GITHUB_AUTH_PROVIDER_ID = "github";
const GITHUB_AUTH_SCOPES = ["repo"];

let currentSession: AuthenticationSession | undefined;

export async function initialize(): Promise<void> {
	try {
		currentSession = await authentication.getSession(GITHUB_AUTH_PROVIDER_ID, GITHUB_AUTH_SCOPES, {
			createIfNone: false,
		});
		if (currentSession) {
			Logger.info(`GitHub authentication initialized for ${currentSession.account.label}`);
		}
	} catch (error) {
		Logger.warn(`Failed to initialize GitHub authentication: ${error}`);
	}
}

export async function login(): Promise<boolean> {
	try {
		currentSession = await authentication.getSession(GITHUB_AUTH_PROVIDER_ID, GITHUB_AUTH_SCOPES, {
			createIfNone: true,
		});

		if (currentSession) {
			window.showInformationMessage(
				`Successfully signed in to GitHub as ${currentSession.account.label}`,
			);
			Logger.info(`GitHub authentication successful for ${currentSession.account.label}`);
			return true;
		}
		return false;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		window.showErrorMessage(`Failed to sign in to GitHub: ${errorMessage}`);
		Logger.error(`GitHub authentication failed: ${errorMessage}`);
		return false;
	}
}

export async function logout(): Promise<void> {
	if (!currentSession) {
		return;
	}

	const username = currentSession.account.label;
	currentSession = undefined;
	window.showInformationMessage(`Signed out from GitHub (${username})`);
	Logger.info(`GitHub session cleared for ${username}`);
}
