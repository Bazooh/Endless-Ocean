import numpy as np

def normalize(vec):
    return vec / np.linalg.norm(vec)


def rotate_vector(direction, u_camera_direction):
    camera_direction = normalize(u_camera_direction)

    # Compute the axis of rotation
    axis = normalize(np.cross(forward, camera_direction))
    angle = np.arccos(np.dot(forward, camera_direction))
    
    print(angle)

    # Create a quaternion for rotation
    half_angle = angle * 0.5
    s = np.sin(half_angle)
    quat = np.array([axis[0] * s, axis[1] * s, 0.0, np.cos(half_angle)])

    # Convert quaternion to rotation matrix
    rotation_matrix = np.array([
        [1.0 - 2.0*quat[1]*quat[1], 2.0*quat[0]*quat[1], 2.0*quat[3]*quat[1]],
        [2.0*quat[0]*quat[1], 1.0 - 2.0*quat[0]*quat[0], -2.0*quat[3]*quat[0]],
        [-2.0*quat[3]*quat[1], 2.0*quat[3]*quat[0], 1.0 - 2.0*(quat[0]*quat[0] + quat[1]*quat[1])],
    ])

    # Apply rotation to direction vector
    rotated_direction = np.dot(rotation_matrix, np.array([direction[0], direction[1], direction[2]]))

    return rotated_direction


forward = np.array([0.0, 0.0, 1.0])
direction = np.array([0.0, 0.0, 1.0])
camera_direction = np.array([0.0, 1.0, 1.0])

rotated_forward = rotate_vector(direction, camera_direction)
print(rotated_forward)