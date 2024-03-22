#include "marching_cubes.h"


float3 getNormal(float x, float y, float z) {
    float nx = (noise(x - EPSILON, y, z) - noise(x + EPSILON, y, z)) / (2 * EPSILON);
    float ny = (noise(x, y - EPSILON, z) - noise(x, y + EPSILON, z)) / (2 * EPSILON);
    float nz = (noise(x, y, z - EPSILON) - noise(x, y, z + EPSILON)) / (2 * EPSILON);

    float length = sqrt(nx*nx + ny*ny + nz*nz);

    return { nx / length, ny / length, nz / length };
}


uint8_t getCubeIdx(float*** noise_values, uint x_idx, uint y_idx, uint z_idx, float threshold) {
    uint8_t cube_index = 0;

    if (noise_values[x_idx][y_idx][z_idx] < threshold) cube_index |= 1;
    if (noise_values[x_idx + 1][y_idx][z_idx] < threshold) cube_index |= 2;
    if (noise_values[x_idx + 1][y_idx + 1][z_idx] < threshold) cube_index |= 4;
    if (noise_values[x_idx][y_idx + 1][z_idx] < threshold) cube_index |= 8;
    if (noise_values[x_idx][y_idx][z_idx + 1] < threshold) cube_index |= 16;
    if (noise_values[x_idx + 1][y_idx][z_idx + 1] < threshold) cube_index |= 32;
    if (noise_values[x_idx + 1][y_idx + 1][z_idx + 1] < threshold) cube_index |= 64;
    if (noise_values[x_idx][y_idx + 1][z_idx + 1] < threshold) cube_index |= 128;

    return cube_index;
}


CubeInfo* getCubeInfo(
    float*** noise_values,
    uint x_idx, uint y_idx, uint z_idx,
    uint16_t edges,
    float ratio_x, float ratio_y, float ratio_z,
    int chunk_pos_x, int chunk_pos_y, int chunk_pos_z,
    float threshold
) {
    CubeInfo* cube_info = new CubeInfo();

    if (edges & 1) {
        cube_info->indices[0] = cube_info->positions.size() / 3;
        float mu = (threshold - noise_values[x_idx][y_idx][z_idx]) / (noise_values[x_idx + 1][y_idx][z_idx] - noise_values[x_idx][y_idx][z_idx]);
        cube_info->positions.push_back((x_idx + mu)*ratio_x + chunk_pos_x);
        cube_info->positions.push_back(y_idx*ratio_y + chunk_pos_y);
        cube_info->positions.push_back(z_idx*ratio_z + chunk_pos_z);
    }
    if (edges & 2) {
        cube_info->indices[1] = cube_info->positions.size() / 3;
        float mu = (threshold - noise_values[x_idx + 1][y_idx][z_idx]) / (noise_values[x_idx + 1][y_idx + 1][z_idx] - noise_values[x_idx + 1][y_idx][z_idx]);
        cube_info->positions.push_back((x_idx + 1)*ratio_x + chunk_pos_x);
		cube_info->positions.push_back((y_idx + mu)*ratio_y + chunk_pos_y);
		cube_info->positions.push_back(z_idx*ratio_z + chunk_pos_z);
    }
    if (edges & 4) {
        cube_info->indices[2] = cube_info->positions.size() / 3;
        float mu = (threshold - noise_values[x_idx][y_idx + 1][z_idx]) / (noise_values[x_idx + 1][y_idx + 1][z_idx] - noise_values[x_idx][y_idx + 1][z_idx]);
        cube_info->positions.push_back((x_idx + mu)*ratio_x + chunk_pos_x);
		cube_info->positions.push_back((y_idx + 1)*ratio_y + chunk_pos_y);
		cube_info->positions.push_back(z_idx*ratio_z + chunk_pos_z);
    }
    if (edges & 8) {
        cube_info->indices[3] = cube_info->positions.size() / 3;
        float mu = (threshold - noise_values[x_idx][y_idx][z_idx]) / (noise_values[x_idx][y_idx + 1][z_idx] - noise_values[x_idx][y_idx][z_idx]);
        cube_info->positions.push_back(x_idx*ratio_x + chunk_pos_x);
		cube_info->positions.push_back((y_idx + mu)*ratio_y + chunk_pos_y);
		cube_info->positions.push_back(z_idx*ratio_z + chunk_pos_z);
    }
    if (edges & 16) {
        cube_info->indices[4] = cube_info->positions.size() / 3;
        float mu = (threshold - noise_values[x_idx][y_idx][z_idx + 1]) / (noise_values[x_idx + 1][y_idx][z_idx + 1] - noise_values[x_idx][y_idx][z_idx + 1]);
        cube_info->positions.push_back((x_idx + mu)*ratio_x + chunk_pos_x);
		cube_info->positions.push_back(y_idx*ratio_y + chunk_pos_y);
		cube_info->positions.push_back((z_idx + 1)*ratio_z + chunk_pos_z);
    }
    if (edges & 32) {
        cube_info->indices[5] = cube_info->positions.size() / 3;
        float mu = (threshold - noise_values[x_idx + 1][y_idx][z_idx + 1]) / (noise_values[x_idx + 1][y_idx + 1][z_idx + 1] - noise_values[x_idx + 1][y_idx][z_idx + 1]);
        cube_info->positions.push_back((x_idx + 1)*ratio_x + chunk_pos_x);
		cube_info->positions.push_back((y_idx + mu)*ratio_y + chunk_pos_y);
		cube_info->positions.push_back((z_idx + 1)*ratio_z + chunk_pos_z);
    }
    if (edges & 64) {
        cube_info->indices[6] = cube_info->positions.size() / 3;
        float mu = (threshold - noise_values[x_idx][y_idx + 1][z_idx + 1]) / (noise_values[x_idx + 1][y_idx + 1][z_idx + 1] - noise_values[x_idx][y_idx + 1][z_idx + 1]);
        cube_info->positions.push_back((x_idx + mu)*ratio_x + chunk_pos_x);
		cube_info->positions.push_back((y_idx + 1)*ratio_y + chunk_pos_y);
		cube_info->positions.push_back((z_idx + 1)*ratio_z + chunk_pos_z);
    }
    if (edges & 128) {
        cube_info->indices[7] = cube_info->positions.size() / 3;
        float mu = (threshold - noise_values[x_idx][y_idx][z_idx + 1]) / (noise_values[x_idx][y_idx + 1][z_idx + 1] - noise_values[x_idx][y_idx][z_idx + 1]);
        cube_info->positions.push_back(x_idx*ratio_x + chunk_pos_x);
		cube_info->positions.push_back((y_idx + mu)*ratio_y + chunk_pos_y);
		cube_info->positions.push_back((z_idx + 1)*ratio_z + chunk_pos_z);
    }
    if (edges & 256) {
        cube_info->indices[8] = cube_info->positions.size() / 3;
        float mu = (threshold - noise_values[x_idx][y_idx][z_idx]) / (noise_values[x_idx][y_idx][z_idx + 1] - noise_values[x_idx][y_idx][z_idx]);
        cube_info->positions.push_back(x_idx*ratio_x + chunk_pos_x);
		cube_info->positions.push_back(y_idx*ratio_y + chunk_pos_y);
		cube_info->positions.push_back((z_idx + mu)*ratio_z + chunk_pos_z);
    }
    if (edges & 512) {
        cube_info->indices[9] = cube_info->positions.size() / 3;
        float mu = (threshold - noise_values[x_idx + 1][y_idx][z_idx]) / (noise_values[x_idx + 1][y_idx][z_idx + 1] - noise_values[x_idx + 1][y_idx][z_idx]);
        cube_info->positions.push_back((x_idx + 1)*ratio_x + chunk_pos_x);
		cube_info->positions.push_back(y_idx*ratio_y + chunk_pos_y);
		cube_info->positions.push_back((z_idx + mu)*ratio_z + chunk_pos_z);
    }
    if (edges & 1024) {
        cube_info->indices[10] = cube_info->positions.size() / 3;
        float mu = (threshold - noise_values[x_idx + 1][y_idx + 1][z_idx]) / (noise_values[x_idx + 1][y_idx + 1][z_idx + 1] - noise_values[x_idx + 1][y_idx + 1][z_idx]);
        cube_info->positions.push_back((x_idx + 1)*ratio_x + chunk_pos_x);
		cube_info->positions.push_back((y_idx + 1)*ratio_y + chunk_pos_y);
		cube_info->positions.push_back((z_idx + mu)*ratio_z + chunk_pos_z);
    }
    if (edges & 2048) {
        cube_info->indices[11] = cube_info->positions.size() / 3;
        float mu = (threshold - noise_values[x_idx][y_idx + 1][z_idx]) / (noise_values[x_idx][y_idx + 1][z_idx + 1] - noise_values[x_idx][y_idx + 1][z_idx]);
        cube_info->positions.push_back(x_idx*ratio_x + chunk_pos_x);
		cube_info->positions.push_back((y_idx + 1)*ratio_y + chunk_pos_y);
		cube_info->positions.push_back((z_idx + mu)*ratio_z + chunk_pos_z);
    }

    return cube_info;
}


GeometryAttributes* getGeometryAttributesFromConstructor(GeometryConstructor* geometry_constructor) {
    GeometryAttributes* geometry_attributes = new GeometryAttributes();

    geometry_attributes->positions_size = geometry_constructor->positions.size();
    geometry_attributes->positions = new float[geometry_attributes->positions_size];
    copy(geometry_constructor->positions.begin(), geometry_constructor->positions.end(), geometry_attributes->positions);

    geometry_attributes->indices_size = geometry_constructor->indices.size();
    geometry_attributes->indices = new uint[geometry_attributes->indices_size];
    copy(geometry_constructor->indices.begin(), geometry_constructor->indices.end(), geometry_attributes->indices);

    geometry_attributes->normals_size = geometry_constructor->positions.size();
    geometry_attributes->normals = new float[geometry_attributes->normals_size];
    for (uint i = 0; i < geometry_attributes->normals_size; i += 3) {
        float3 normal = getNormal(
            geometry_attributes->positions[i],
            geometry_attributes->positions[i + 1],
            geometry_attributes->positions[i + 2]
        );

        geometry_attributes->normals[i] = normal.x;
        geometry_attributes->normals[i + 1] = normal.y;
        geometry_attributes->normals[i + 2] = normal.z;
    }

    return geometry_attributes;
}


GeometryAttributes* getGeometryAttributes(
    int chunk_x, int chunk_y, int chunk_z,
    uint n_vertices_x, uint n_vertices_y, uint n_vertices_z,
    float chunk_size_x, float chunk_size_y, float chunk_size_z,
    float noise_frequency_x, float noise_frequency_y, float noise_frequency_z,
    float threshold
) {
    GeometryConstructor* geometry_constructor = new GeometryConstructor();

    float ratio_x = chunk_size_x / n_vertices_x;
    float ratio_y = chunk_size_y / n_vertices_y;
    float ratio_z = chunk_size_z / n_vertices_z;

    float chunk_pos_x = chunk_x * chunk_size_x;
    float chunk_pos_y = chunk_y * chunk_size_y;
    float chunk_pos_z = chunk_z * chunk_size_z;

    float*** noise_values = new float**[n_vertices_x + 1];
    for (uint x_idx = 0; x_idx < n_vertices_x + 1; x_idx++) {
        noise_values[x_idx] = new float*[n_vertices_y + 1];
        for (uint y_idx = 0; y_idx < n_vertices_y + 1; y_idx++) {
            noise_values[x_idx][y_idx] = new float[n_vertices_z + 1];
            for (uint z_idx = 0; z_idx < n_vertices_z + 1; z_idx++) {
                noise_values[x_idx][y_idx][z_idx] = noise(
                    noise_frequency_x*(chunk_x + (float)x_idx / n_vertices_x),
                    noise_frequency_y*(chunk_y + (float)y_idx / n_vertices_y),
                    noise_frequency_z*(chunk_z + (float)z_idx / n_vertices_z)
                );
            }
        }
    }

    for (uint x_idx = 0; x_idx < n_vertices_x; x_idx++) {
        for (uint y_idx = 0; y_idx < n_vertices_y; y_idx++) {
            for (uint z_idx = 0; z_idx < n_vertices_z; z_idx++) {
                uint8_t cube_idx = getCubeIdx(noise_values, x_idx, y_idx, z_idx, threshold);

                uint16_t edges = edgeTable[cube_idx];

                CubeInfo* cube_info = getCubeInfo(
                    noise_values,
                    x_idx, y_idx, z_idx,
                    edges,
                    ratio_x, ratio_y, ratio_z,
                    chunk_pos_x, chunk_pos_y, chunk_pos_z,
                    threshold
                );
                
                for (uint8_t i = 0; i < 16; i++) {
                    int8_t val = triTable[16*cube_idx + i];

                    if (val == -1) { break; }
                        
                    geometry_constructor->indices.push_back(cube_info->indices[val] + geometry_constructor->positions.size() / 3);
                }
                geometry_constructor->positions.insert(geometry_constructor->positions.end(), cube_info->positions.begin(), cube_info->positions.end());

                delete cube_info;
            }
        }
    }

    GeometryAttributes* geometry_attributes = getGeometryAttributesFromConstructor(geometry_constructor);

    delete geometry_constructor;
    for (uint x_idx = 0; x_idx < n_vertices_x + 1; x_idx++) {
        for (uint y_idx = 0; y_idx < n_vertices_y + 1; y_idx++) {
            delete[] noise_values[x_idx][y_idx];
        }
        delete[] noise_values[x_idx];
    }
    delete[] noise_values;

    return geometry_attributes;
}