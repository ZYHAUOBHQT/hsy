var getAllTableHeadNodeByMenuNodeIdUrl = "/tableHeadNode/getAllTableHeadNodeByMenuNodeId";
var updateTableHeadNodeUrl = "/tableHeadNode/updateTableHeadNode";
var getAreaTableByMenuNodeIdUrl = "/areaTable/getAreaTableByMenuNodeId";
var getCountryByAreaIdUrl = "/country/getCountryByAreaId";
var getAreaTableDataByCountryIdAndTableHeadNodeIdUrl = "/areaTableData/getAreaTableDataByCountryIdAndTableHeadNodeId";

var areaId = 1;

/**
 * 菜单节点ID
 * @type {number}
 */
var menuNodeId = 0;

// 全部节点
var headNodes = new Array();

// 叶子结点
var leafNodes = new Array();

// 非叶子结点
var notLeafNodes = new Array();

// 树的深度
var deepestNodeLevel = 0;

// 城市
var countries = "";

var countryTableHeadNode = {
    id: -1,
    headNodeName: "国家或地区",
    fatherId: 0,
    level: 1,
    isLeaf: 1,
    myGroup: 0,
    height: 1,
    weight: 1,
    menuNodeId: menuNodeId,
    isParent: false
};

var areaId = 1;

var tableData = new Array();

$(function () {
    menuNodeId = getParams("menuNodeId");
    showAreaTable(menuNodeId);
    addAreaTableData();
    // 将叶子结点放入Option中
    pushLeafNodesInOption();

    // 将数据填入图表
    pushDataInOption();

    myChart.setOption(option);
})

function pushDataInOption() {
    for (var i = 0; i < leafNodes.length; i++) {
        if (leafNodes[i].id != -1) {
            var myOptionSeries = {
                name: leafNodes[i].headNodeName,
                type: 'bar',
                data: [],
                markPoint: {
                    data: [
                        {type: 'max', name: '最大值'},
                        {type: 'min', name: '最小值'}
                    ]
                },
                markLine: {
                    data: [
                        {type: 'average', name: '平均值'}
                    ]
                }
            }
            for (var j = 0; j < countries.length; j++) {
                for (var k = 0; k < tableData.length; k++) {
                    if ((leafNodes[i].id == tableData[k].tableHeadNodeId) && (countries[j].id == tableData[k].countryId)) {
                        myOptionSeries.data.push(parseInt(tableData[k].content));
                        break;
                    }
                }
            }
            option.series.push(myOptionSeries);
        }
    }
}

function pushLeafNodesInOption() {
    for (var i = 0; i < leafNodes.length; i++) {
        if (leafNodes[i].id != -1)
            option.legend.data.push(leafNodes[i].headNodeName);
    }
}

function getParams(key) {
    var reg = new RegExp("(^|&)" + key + "=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) {
        return unescape(r[2]);
    }
    return null;
}

// 是否叶子节点
function isLeaf(leaf) {
    return (leaf == 0 ? true : false);
}

function showAreaTable(menuNodeId) {
    getAreaTableByMenuNodeId(menuNodeId);
    buildTableHeadNodeByAreaTableId();
}

// 根据菜单节点ID获取表格
function getAreaTableByMenuNodeId(menuNodeId) {
    $.ajax({
        type: "GET",
        url: getAreaTableByMenuNodeIdUrl,
        data: {
            menuNodeId: menuNodeId
        },
        beforeSend: function (XMLHttpRequest) {
        },
        success: function (result) {
            if (result != null) {
                $("#areaTableName").html(result.areaTableName);
                $("#areaTableNameCap").html(result.areaTableName + " 柱状图");
                $("#areaTableEnglishName").html(result.areaTableEnglishName);
                $("#areaTableEnglishNameCap").html(result.areaTableEnglishName);
                option.title.text = result.areaTableName;
                option.title.subtext = result.areaTableEnglishName;
            }
        },
        complete: function (XMLHttpRequest, textStatus) {
        },
        error: function () {
        }
    });
}

function buildTableHeadNodeByAreaTableId() {
    getAllNodes();
    startBuild();
}

function startBuild() {
    // 初始化
    init();

    // 获取宽高
    setHeightAndWeight();

    // 设置节点排序数
    setNodesMyGroup();

    // 排序
    sortMyNodes();

    // 生成表格
    generatingTable();
}

// 排序
function sortMyNodes() {
    for (var i = 0; i < headNodes.length; i++) {
        for (var j = headNodes.length - 1; j > i; j--) {
            if (headNodes[j].myGroup < headNodes[j - 1].myGroup) {
                var temp = headNodes[j];
                headNodes[j] = headNodes[j - 1];
                headNodes[j - 1] = temp;
            }
        }
    }
}

// 设置节点排序数
function setNodesMyGroup() {
    for (var i = 0; i < deepestNodeLevel; i++) {
        var levelNodes = getLevelNodes(i);
        if (i === 0) {
            for (var j = 0; j < levelNodes.length; j++) {
                levelNodes[j].myGroup = j;
            }
        } else {
            for (var j = 0; j < levelNodes.length; j++) {
                var levelFatherNode = getNodeById(levelNodes[j].fatherId);
                levelNodes[j].myGroup = levelFatherNode.myGroup * 100 + j;
            }
        }
        updateHeadNodes(levelNodes);
    }
}

// 获取层级节点
function getLevelNodes(level) {
    // 层级节点
    var levelNodes = new Array();

    for (var i = 0; i < headNodes.length; i++) {
        if (headNodes[i].level === (level + 1)) {
            levelNodes.push(headNodes[i]);
        }
    }

    return levelNodes;
}

// 获取宽高
function setHeightAndWeight() {
    // 设置叶子结点高度
    setLeafNodeHeight();

    // 设置非叶子结点宽度
    setNotLeafNodesWeight();
}

// 设置非叶子结点宽度
function setNotLeafNodesWeight() {
    for (var i = 0; i < notLeafNodes.length; i++) {
        var notLeafNodeWeight = 0;
        for (var j = 0; j < leafNodes.length; j++) {
            var middleNode = leafNodes[j];
            for (var k = 0; k < (leafNodes[j].level - notLeafNodes[i].level); k++) {
                middleNode = getNodeById(middleNode.fatherId);
            }
            if (middleNode.id === notLeafNodes[i].id) {
                notLeafNodeWeight++;
            }
        }
        notLeafNodes[i].weight = notLeafNodeWeight;
    }

    // 更新根节点
    updateHeadNodes(notLeafNodes);
}

// 根据ID获取节点
function getNodeById(fatherId) {
    for (var i = 0; i < headNodes.length; i++) {
        if (headNodes[i].id == fatherId) {
            return headNodes[i];
        }
    }
}

// 设置叶子结点高度
function setLeafNodeHeight() {
    for (var i = 0; i < leafNodes.length; i++) {
        if (leafNodes[i].level < deepestNodeLevel) {
            leafNodes[i].height = deepestNodeLevel - leafNodes[i].level + 1;
        }
    }
    updateHeadNodes(leafNodes);
}

// 更新全部节点
function updateHeadNodes(myNodes) {
    for (var i = 0; i < myNodes.length; i++) {
        for (var j = 0; j < headNodes.length; j++) {
            if (myNodes[i].id === headNodes[j].id) {
                headNodes[j] = myNodes[i];
                break;
            }
        }
    }

    for (var i = 0; i < myNodes.length; i++) {
        if (myNodes[i].id !== -1) {
            updateTableHeadNode(myNodes[i]);
        }
    }
}

/**
 * 更新节点
 * @param node
 */
function updateTableHeadNode(myNode) {
    var a = myNode;
    $.ajax({
        type: "GET",
        url: updateTableHeadNodeUrl,
        async: false, // 取消异步请求
        data: {
            id: parseInt(myNode.id),
            isLeaf: isTheParent(myNode.isParent),
        },
        beforeSend: function (XMLHttpRequest) {
        },
        success: function (result) {
            if (result != null) {
                // buildTableHeadNodeByAreaTableId();
            }
        },
        complete: function (XMLHttpRequest, textStatus) {
        },
        error: function () {
        }
    });
}

// 初始化
function init() {
    // 获取所有的叶子结点
    getLeafNodes();

    // 获取树的高度
    getDeep();

    // 获取所有的非叶子结点
    getNotLeafNodes();
}

// 获取所有的非叶子结点
function getNotLeafNodes() {
    for (var i = 0; i < headNodes.length; i++) {
        if (headNodes[i].isLeaf != 1) {
            notLeafNodes.push(headNodes[i]);
        }
    }
}

// 获取所有的叶子结点
function getLeafNodes() {
    for (var i = 0; i < headNodes.length; i++) {
        if (headNodes[i].isLeaf == 1) {
            leafNodes.push(headNodes[i]);
        }
    }
}

// 获取树的高度
function getDeep() {
    for (var i = 0; i < leafNodes.length; i++) {
        if (leafNodes[i].level >= deepestNodeLevel) {
            deepestNodeLevel = leafNodes[i].level;
        }
    }
}

// 获取所有节点
function getAllNodes() {
    $.ajax({
        type: "GET",
        url: getAllTableHeadNodeByMenuNodeIdUrl,
        async: false, // 取消异步请求
        data: {
            menuNodeId: menuNodeId
        },
        beforeSend: function (XMLHttpRequest) {
        },
        success: function (result) {
            if (result != null) {
                pushHeadNodes(result);
            }
        },
        complete: function (XMLHttpRequest, textStatus) {
        },
        error: function () {
        }
    });
}

// 将获取到的节点放置在全部节点中
function pushHeadNodes(result) {
    clearHeadNodes();
    for (var i = 0; i < result.length; i++) {
        var addCountryTableHeadNode = {
            id: result[i].id,
            headNodeName: result[i].tableHeadNodeName,
            fatherId: result[i].fatherId,
            level: result[i].level,
            isLeaf: result[i].isLeaf,
            myGroup: result[i].myGroup,
            height: result[i].height,
            weight: result[i].weight,
            menuNodeId: menuNodeId,
            isParent: isLeaf(result[i].isLeaf)
        }
        headNodes.push(addCountryTableHeadNode);
    }
}

// 清空HeadNodes数组
function clearHeadNodes() {
    deepestNodeLevel = 0;
    leafNodes.splice(0, leafNodes.length);
    notLeafNodes.splice(0, notLeafNodes.length);
    headNodes.splice(0, headNodes.length);
    headNodes.push(countryTableHeadNode);
}

// 生成表格
function generatingTable() {
    var myHtml = "";
    for (var i = 0; i < deepestNodeLevel; i++) {
        myHtml += "<tr>";
        var levelNodes = getLevelNodes(i);
        for (var j = 0; j < levelNodes.length; j++) {
            myHtml += "<th id='" + levelNodes[j].id + "' rowspan='" + levelNodes[j].height + "' colspan='" + levelNodes[j].weight + "'>" + levelNodes[j].headNodeName + "</th>";
        }
        myHtml += "</tr>";
    }
    $("#myTable").html(myHtml);
}

function isTheParent(parent) {
    var a = (parent === true);
    var b = (parent == true);
    return (parent == true ? 0 : 1);
}

// 添加表格数据
function addAreaTableData() {
    // 获取所有的国家地区
    getCountryByAreaId();

    var addTableHtml = "";

    for (var i = 0; i < countries.length; i++) {
        addTableHtml += "<tr><td id='" + countries[i].id + "'>" + countries[i].countryName + "</td>";
        for (var j = 0; j < leafNodes.length; j++) {
            if (leafNodes[j].id != -1) {
                addTableHtml += "<td id='" + countries[i].id + "_" + leafNodes[j].id + "'></td>";
            }
        }
        addTableHtml += "</tr>";
    }

    $("#myTableData").html(addTableHtml);

    // 获取所有数据
    for (var i = 0; i < countries.length; i++) {
        for (var j = 0; j < leafNodes.length; j++) {
            if (leafNodes[j].id != -1) {
                getAreaTableDataByCountryIdAndTableHeadNodeId(countries[i].id, leafNodes[j].id);
            }
        }
    }
}

// 根据国家ID和叶子节点ID获取或添加数据
function getAreaTableDataByCountryIdAndTableHeadNodeId(countryId, tableHeadNodeId) {
    $.ajax({
        type: "GET",
        url: getAreaTableDataByCountryIdAndTableHeadNodeIdUrl,
        async: false, // 取消异步请求
        data: {
            countryId: countryId,
            tableHeadNodeId: tableHeadNodeId,
            menuNodeId: menuNodeId
        },
        beforeSend: function (XMLHttpRequest) {
        },
        success: function (result) {
            $("#" + countryId + "_" + tableHeadNodeId).html(result.content);
            tableData.push(result);
        },
        complete: function (XMLHttpRequest, textStatus) {
        },
        error: function () {
        }
    });
}

// 获取所有的国家地区
function getCountryByAreaId() {
    $.ajax({
        type: "GET",
        url: getCountryByAreaIdUrl,
        async: false, // 取消异步请求
        data: {
            areaId: areaId
        },
        beforeSend: function (XMLHttpRequest) {
        },
        success: function (result) {
            if (result !== null) {
                countries = result;
                pushCountriesInOption();
            }
        },
        complete: function (XMLHttpRequest, textStatus) {
        },
        error: function () {
        }
    });
}

// 将国家地区放进图表
function pushCountriesInOption() {
    for (var i = 0; i < countries.length; i++) {
        option.xAxis[0].data.push(countries[i].countryName);
    }
}