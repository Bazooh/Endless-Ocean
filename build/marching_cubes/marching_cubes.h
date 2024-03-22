#include <list>
#include <iostream>
#include <cmath>

#include "tables.h"
#include "noise.cpp"


const float EPSILON = 0.00001f;


using namespace std;

typedef unsigned int uint;


struct CubeInfo {
    list<float> positions {};
    uint indices[12];
};


struct GeometryConstructor {
    list<float> positions {};
    list<uint> indices {};
};


struct GeometryAttributes {
    float* positions;
    uint positions_size;

    float* normals;
    uint normals_size;

    uint* indices;
    uint indices_size;
};


struct float3 {
    float x;
    float y;
    float z;
};


extern "C" {
    GeometryAttributes* getGeometryAttributes(
        int chunk_x, int chunk_y, int chunk_z,
        uint n_vertices_x, uint n_vertices_y, uint n_vertices_z,
        float chunk_size_x, float chunk_size_y, float chunk_size_z,
        float noise_frequency_x, float noise_frequency_y, float noise_frequency_z,
        float threshold
    );
}