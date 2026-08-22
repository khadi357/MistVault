const BASE_URL = "https://medsec.onrender.com/api";

const token = localStorage.getItem("authToken");

// ✅ GET ALL
export const getHospitals = async () => {
  console.log("you can delete this okay");
  const res = await fetch(`${BASE_URL}/get-hospitals`);
  if (!res.ok) throw new Error("Failed to fetch hospitals");
  return res.json();
};

// ✅ GET ONE
export const getHospitalById = async (id) => {
  const res = await fetch(`${BASE_URL}/hospitals/${id}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to fetch hospital");

  const data = await res.json();
  return data.hospital; // 🔑 return the hospital object only
};

// ✅ UPDATE
export const updateHospital = async (id, data) => {
  const res = await fetch(`${BASE_URL}/update-hospital/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Update failed");
  return res.json();
};

// ✅ DELETE
export const deleteHospital = async (id, reason) => {
  const res = await fetch(`${BASE_URL}/update-hospital/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason }),
  });

  if (!res.ok) throw new Error("Delete failed");
  return res.json();
};

export const archiveHospital = async (id, reason) => {
  try {
    const res = await fetch(
      `/api/archive-hospitals/${id}?reason=${encodeURIComponent(reason)}`,
      {
        method: "PATCH", // or POST depending on your backend
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) throw new Error("Failed to archive hospital");

    return await res.json();
  } catch (error) {
    throw error;
  }
};

import toast from "react-hot-toast";

export const sendNotification = async (hospitalId) => {
  try {
    const response = await fetch(
      `${BASE_URL}/send-hospital-details/${hospitalId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error("Notification failed");
    }

    const data = await response.json();

    // ✅ Success toast
    toast.success(data.message || "Notification sent successfully");
    return data;
  } catch (err) {
    console.error("Error sending notification:", err);

    // ❌ Error toast
    toast.error(err.message || "Failed to send notification");
    return null;
  }
};

export const suspendHospital = async (hospitalId) => {
  // ✅ Ask for confirmation (browser confirm dialog)
  const confirmed = window.confirm("Do you want to suspend this hospital?");
  if (!confirmed) return;

  try {
    const response = await fetch(`${BASE_URL}/disable-hospital/${hospitalId}`, {
      method: "PATCH", // or "PATCH"/"POST" depending on your backend
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Suspension failed");
    }

    const data = await response.json();

    // ✅ Success toast
    toast.success(data.message || "Hospital suspended successfully");
    return data;
  } catch (err) {
    console.error("Error suspending hospital:", err);

    // ❌ Error toast
    toast.error(err.message || "Failed to suspend hospital");
    return null;
  }
};

export const reEnableHospital = async (hospitalId) => {
  const confirmed = window.confirm("Do you want to re-enable this hospital?");
  if (!confirmed) return;

  try {
    const response = await fetch(`${BASE_URL}/enable-hospital/${hospitalId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to re-enable hospital");
    }

    const data = await response.json();
    toast.success(data.message || "Hospital re-enabled successfully");
    return data;
  } catch (err) {
    console.error("Error re-enabling hospital:", err);
    toast.error(err.message || "Something went wrong");
    return null;
  }
};
