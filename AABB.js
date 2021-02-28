class AABB {
    constructor(minX, minY, minZ, maxX, maxY, maxZ){
        this.minX = minX;
        this.minY = minY;
        this.minZ = minZ;
        this.maxX = maxX;
        this.maxY = maxY;
        this.maxZ = maxZ;
    }

    isPointInsideAABB(point) {
        return  (point.x >= minX && point.x <= maxX) &&
                (point.y >= minY && point.y <= maxY) &&
                (point.z >= minZ && point.z <= maxZ);
    }
}
