{
  "_$ver": 1,
  "_$id": "dmvroob9",
  "_$type": "Scene",
  "left": 0,
  "right": 0,
  "top": 0,
  "bottom": 0,
  "name": "Scene2D",
  "_$child": [
    {
      "_$id": "n9gjxcltvl",
      "_$type": "Scene3D",
      "name": "Scene3D",
      "skyRenderer": {
        "meshType": "dome",
        "material": {
          "_$uuid": "793cffc6-730a-4756-a658-efe98c230292",
          "_$type": "Material"
        }
      },
      "ambientColor": {
        "_$type": "Color",
        "r": 0.424308,
        "g": 0.4578516,
        "b": 0.5294118
      },
      "_reflectionsIblSamples": 1024,
      "fogStart": 0,
      "fogEnd": 300,
      "fogDensity": 0.01,
      "fogColor": {
        "_$type": "Color",
        "r": 0.5,
        "g": 0.5,
        "b": 0.5
      },
      "lightmaps": [],
      "componentElementDatasMap": {
        "_$type": "Record"
      },
      "_$child": [
        {
          "_$id": "6jx8h8bvc6",
          "_$type": "Camera",
          "name": "Main Camera",
          "transform": {
            "localPosition": {
              "_$type": "Vector3",
              "y": 1,
              "z": 5
            }
          },
          "orthographicVerticalSize": 10,
          "fieldOfView": 60,
          "nearPlane": 0.3,
          "farPlane": 1000,
          "clearFlag": 1,
          "clearColor": {
            "_$type": "Color",
            "r": 0.3921,
            "g": 0.5843,
            "b": 0.9294
          },
          "cullingMask": 2147483647,
          "normalizedViewport": {
            "_$type": "Viewport",
            "width": 1,
            "height": 1
          },
          "depthTextureFormat": 35
        },
        {
          "_$id": "6ni3p096l5",
          "_$type": "DirectionLight",
          "name": "Direction Light",
          "transform": {
            "localPosition": {
              "_$type": "Vector3",
              "x": 5,
              "y": 5,
              "z": 5
            },
            "localRotation": {
              "_$type": "Quaternion",
              "x": -0.40821789367673483,
              "y": 0.23456971600980447,
              "z": 0.109381654946615,
              "w": 0.875426098065593
            }
          },
          "_$comp": [
            {
              "_$type": "DirectionLightCom",
              "color": {
                "_$type": "Color",
                "r": 0.6,
                "g": 0.6,
                "b": 0.6
              },
              "intensity": 1,
              "lightmapBakedType": 1,
              "shadowStrength": 1,
              "shadowDistance": 50,
              "shadowDepthBias": 1,
              "shadowNormalBias": 1,
              "shadowNearPlane": 0.1,
              "strength": 1,
              "angle": 0.526,
              "maxBounces": 1024
            }
          ]
        },
        {
          "_$id": "to74d73p",
          "_$type": "Sprite3D",
          "name": "Cube",
          "_$comp": [
            {
              "_$type": "MeshFilter",
              "sharedMesh": {
                "_$uuid": "6e013e32-fec7-4397-80d1-f918a07607be",
                "_$type": "Mesh"
              }
            },
            {
              "_$type": "MeshRenderer",
              "sharedMaterials": [
                {
                  "_$uuid": "6f90bbb0-bcb2-4311-8a9d-3d8277522098",
                  "_$type": "Material"
                }
              ]
            },
            {
              "_$type": "7bad1742-6eed-4d8d-81c0-501dc5bf03d6",
              "scriptPath": "../src/Main.ts"
            }
          ]
        }
      ]
    },
    {
      "_$id": "7wd8gfuf",
      "_$type": "Button",
      "name": "Button",
      "x": 179,
      "y": 129.5,
      "width": 120,
      "height": 40,
      "_mouseState": 2,
      "skin": "res://d4cfd6a8-0d0a-475b-ac93-d85eaa646936",
      "label": "更新",
      "labelSize": 20,
      "labelAlign": "center",
      "labelVAlign": "middle",
      "_$comp": [
        {
          "_$type": "c81b2735-df3c-458e-9f39-988e90e2ebdc",
          "scriptPath": "../src/AllTest.ts",
          "cmd": "update"
        }
      ]
    },
    {
      "_$id": "7cphrnol",
      "_$type": "Button",
      "name": "Button(1)",
      "x": 179,
      "y": 179,
      "width": 120,
      "height": 40,
      "_mouseState": 2,
      "skin": "res://d4cfd6a8-0d0a-475b-ac93-d85eaa646936",
      "label": "clean",
      "labelSize": 20,
      "labelAlign": "center",
      "labelVAlign": "middle",
      "_$comp": [
        {
          "_$type": "c81b2735-df3c-458e-9f39-988e90e2ebdc",
          "scriptPath": "../src/AllTest.ts",
          "cmd": "clean"
        }
      ]
    },
    {
      "_$id": "hb1lpycm",
      "_$type": "Image",
      "name": "Image",
      "x": 410,
      "y": 108,
      "width": 221,
      "height": 10,
      "skin": "res://0180cc61-a417-48e3-b42d-fe3d024d7469",
      "color": "#ffffff"
    },
    {
      "_$id": "k06a10xc",
      "_$type": "Button",
      "name": "Button(2)",
      "x": 179,
      "y": 229,
      "width": 120,
      "height": 40,
      "_mouseState": 2,
      "skin": "res://d4cfd6a8-0d0a-475b-ac93-d85eaa646936",
      "label": "udpate",
      "labelSize": 20,
      "labelAlign": "center",
      "labelVAlign": "middle"
    },
    {
      "_$id": "1ebdg76c",
      "_$type": "Button",
      "name": "Button(3)",
      "x": 179,
      "y": 379,
      "width": 120,
      "height": 40,
      "_mouseState": 2,
      "skin": "res://d4cfd6a8-0d0a-475b-ac93-d85eaa646936",
      "label": "udpateall",
      "labelSize": 20,
      "labelAlign": "center",
      "labelVAlign": "middle",
      "_$comp": [
        {
          "_$type": "c81b2735-df3c-458e-9f39-988e90e2ebdc",
          "scriptPath": "../src/AllTest.ts",
          "cmd": "updateAll"
        }
      ],
      "_$child": [
        {
          "_$id": "t3b6bbqb",
          "_$type": "ProgressBar",
          "name": "ProgressBar",
          "x": 205.94028553592125,
          "y": 5.237863740726198,
          "width": 120,
          "height": 30,
          "skin": "res://ae3de75e-ee9f-478d-9f8b-ede75a4fc296",
          "value": 0.5
        }
      ]
    },
    {
      "_$id": "gxe0f1lq",
      "_$type": "Button",
      "name": "Button(4)",
      "x": 179,
      "y": 279,
      "width": 120,
      "height": 40,
      "_mouseState": 2,
      "skin": "res://d4cfd6a8-0d0a-475b-ac93-d85eaa646936",
      "label": "ImgSrc",
      "labelSize": 20,
      "labelAlign": "center",
      "labelVAlign": "middle",
      "_$comp": [
        {
          "_$type": "c81b2735-df3c-458e-9f39-988e90e2ebdc",
          "scriptPath": "../src/AllTest.ts",
          "cmd": "imgSrc"
        }
      ]
    },
    {
      "_$id": "x2j4c0bu",
      "_$type": "Button",
      "name": "Button(5)",
      "x": 179,
      "y": 329,
      "width": 120,
      "height": 40,
      "_mouseState": 2,
      "skin": "res://d4cfd6a8-0d0a-475b-ac93-d85eaa646936",
      "label": "普通下载",
      "labelSize": 20,
      "labelAlign": "center",
      "labelVAlign": "middle",
      "_$comp": [
        {
          "_$type": "c81b2735-df3c-458e-9f39-988e90e2ebdc",
          "scriptPath": "../src/AllTest.ts",
          "cmd": "commondown"
        }
      ]
    },
    {
      "_$id": "d1deevim",
      "_$type": "Button",
      "name": "Button(6)",
      "x": 179,
      "y": 504,
      "width": 120,
      "height": 40,
      "_mouseState": 2,
      "skin": "res://d4cfd6a8-0d0a-475b-ac93-d85eaa646936",
      "label": "zip",
      "labelSize": 20,
      "labelAlign": "center",
      "labelVAlign": "middle",
      "_$comp": [
        {
          "_$type": "c81b2735-df3c-458e-9f39-988e90e2ebdc",
          "scriptPath": "../src/AllTest.ts",
          "cmd": "zipupdate"
        }
      ]
    },
    {
      "_$id": "ff8bvubd",
      "_$type": "Button",
      "name": "Button(7)",
      "x": 110,
      "y": 437,
      "width": 120,
      "height": 40,
      "_mouseState": 2,
      "skin": "res://d4cfd6a8-0d0a-475b-ac93-d85eaa646936",
      "label": "APK资源",
      "labelSize": 20,
      "labelAlign": "center",
      "labelVAlign": "middle",
      "_$comp": [
        {
          "_$type": "c81b2735-df3c-458e-9f39-988e90e2ebdc",
          "scriptPath": "../src/AllTest.ts",
          "cmd": "apkres"
        }
      ],
      "_$child": [
        {
          "_$id": "xsdyncb1",
          "_$type": "Text",
          "name": "Text",
          "x": 155.16063674139792,
          "y": 2.92147634903381,
          "width": 120,
          "height": 30,
          "text": "Text",
          "fontSize": 20,
          "color": "#FFFFFF",
          "leading": 2
        }
      ]
    }
  ]
}