// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

abstract contract DatasetGraph {
    mapping(uint256 => uint256) internal _parentDatasetIds;
    mapping(uint256 => uint256[]) internal _childDatasetIds;

    function getParentDatasetId(uint256 datasetId) public view virtual returns (uint256 parentDatasetId) {
        parentDatasetId = _parentDatasetIds[datasetId];
    }

    function getChildDatasetIds(uint256 datasetId) public view virtual returns (uint256[] memory childDatasetIds) {
        childDatasetIds = _childDatasetIds[datasetId];
    }

    function getAncestry(uint256 datasetId, uint256 maxDepth) external view returns (uint256[] memory ancestry) {
        uint256[] memory ancestryBuffer = new uint256[](maxDepth);
        uint256 cursor = datasetId;
        uint256 count;

        while (cursor != 0 && count < maxDepth) {
            cursor = _parentDatasetIds[cursor];
            if (cursor == 0) break;
            ancestryBuffer[count] = cursor;
            unchecked {
                ++count;
            }
        }

        ancestry = new uint256[](count);
        for (uint256 i = 0; i < count; ++i) {
            ancestry[i] = ancestryBuffer[i];
        }
    }

    function _linkLineage(uint256 parentDatasetId, uint256 childDatasetId) internal {
        _parentDatasetIds[childDatasetId] = parentDatasetId;
        _childDatasetIds[parentDatasetId].push(childDatasetId);
    }
}
