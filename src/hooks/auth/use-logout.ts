import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "@/services/features/auth/authSlice";

export const useLogout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return () => {
    localStorage.clear();
    dispatch(logout());
    navigate("/login");
  };
};
