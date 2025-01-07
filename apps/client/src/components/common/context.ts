import { UserDto } from "@biketag/models"
import { createContext } from "react"

export const UserContext = createContext<UserDto | undefined>(undefined);
