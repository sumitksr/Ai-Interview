import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import connectDB from "../lib/mongodb";
import User from "../models/User";
import Review from "../models/reviews";
import Teacher from "../models/Teacher";
import UserData from "../models/UserData";
import Booking from "../models/Booking";

export { 
    Navbar, 
    Footer,
    connectDB,
    User,
    Booking,
    Review,
    Teacher,
    UserData
};